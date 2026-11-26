const CODE_CHARACTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

const json = (body, status = 200, request) => new Response(JSON.stringify(body), {
  status,
  headers: {
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-origin": request?.headers.get("origin") ?? "*",
    "access-control-allow-methods": "GET, POST, OPTIONS",
    "access-control-allow-headers": "content-type",
    "vary": "origin",
  },
});

const makeCode = () => Array.from({ length: 6 }, () =>
  CODE_CHARACTERS[Math.floor(Math.random() * CODE_CHARACTERS.length)],
).join("");

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") return new Response(null, {
      status: 204,
      headers: {
        "access-control-allow-origin": request.headers.get("origin") ?? "*",
        "access-control-allow-methods": "GET, POST, OPTIONS",
        "access-control-allow-headers": "content-type",
        "vary": "origin",
      },
    });
    if (!url.pathname.startsWith("/api/rooms")) return json({ error: "Not found." }, 404, request);

    if (url.pathname === "/api/rooms" && request.method === "POST") {
      const input = await request.json().catch(() => null);
      if (!input || !validName(input.hostName) || !input.grade || !input.subject) {
        return json({ error: "Enter a name, grade, and subject to create a room." }, 400, request);
      }

      for (let attempt = 0; attempt < 8; attempt += 1) {
        const code = makeCode();
        const sessionId = crypto.randomUUID();
        const createdAt = new Date().toISOString();
        const session = {
          id: sessionId,
          session_code: code,
          host_name: input.hostName.trim(),
          status: "waiting",
          grade: String(input.grade),
          subject: String(input.subject),
          chapter_id: String(input.chapterId ?? "all"),
          difficulty: String(input.difficulty ?? "all"),
          current_question_index: 0,
          created_at: createdAt,
        };
        const participant = {
          id: crypto.randomUUID(), session_id: sessionId,
          player_name: input.hostName.trim(), score: 0, is_host: true, joined_at: createdAt,
        };
        const room = env.ROOMS.get(env.ROOMS.idFromName(code));
        const result = await room.fetch("https://room.internal/create", {
          method: "POST", headers: { "content-type": "application/json" },
          body: JSON.stringify({ session, participant }),
        });
        if (result.status !== 409) return withCors(result, request);
      }
      return json({ error: "Could not reserve a room code. Please try again." }, 503, request);
    }

    const match = url.pathname.match(/^\/api\/rooms\/([A-HJ-NP-Z2-9]{6})(?:\/(join|start|next|end|answers))?$/i);
    if (!match) return json({ error: "Room not found." }, 404, request);
    const code = match[1].toUpperCase();
    const action = match[2] ?? "room";
    if ((action === "room" && request.method !== "GET") || (action !== "room" && request.method !== "POST")) {
      return json({ error: "Method not allowed." }, 405, request);
    }
    const room = env.ROOMS.get(env.ROOMS.idFromName(code));
    const body = request.method === "POST" ? await request.text() : undefined;
    const result = await room.fetch(`https://room.internal/${action}`, {
      method: request.method,
      headers: { "content-type": "application/json" },
      body,
    });
    return withCors(result, request);
  },
};

export class RoomDurableObject {
  constructor(state) {
    this.state = state;
  }

  async fetch(request) {
    const path = new URL(request.url).pathname;
    const room = await this.state.storage.get("room");
    const input = request.method === "POST" ? await request.json().catch(() => null) : null;

    if (path === "/create" && request.method === "POST") {
      if (room) return json({ error: "Room code collision." }, 409);
      await this.state.storage.put("room", {
        session: input.session,
        participants: [input.participant],
        answers: [],
      });
      return json({ session: input.session, participant: input.participant });
    }
    if (!room) return json({ error: "Room not found. Check the code and try again." }, 404);

    if (path === "/room" && request.method === "GET") {
      room.participants.sort((a, b) => b.score - a.score || a.joined_at.localeCompare(b.joined_at));
      return json({ session: room.session, participants: room.participants });
    }

    if (path === "/join" && request.method === "POST") {
      if (room.session.status !== "waiting") return json({ error: "This exam has already started." }, 409);
      if (!validName(input?.playerName)) return json({ error: "Enter your name to join." }, 400);
      if (room.participants.length >= 200) return json({ error: "This room is full." }, 409);
      const participant = {
        id: crypto.randomUUID(), session_id: room.session.id,
        player_name: input.playerName.trim(), score: 0, is_host: false,
        joined_at: new Date().toISOString(),
      };
      room.participants.push(participant);
      await this.state.storage.put("room", room);
      return json({ session: room.session, participant });
    }

    if (["/start", "/next", "/end"].includes(path)) {
      if (!isHost(room, input?.participantId)) return json({ error: "Only the host can control this exam." }, 403);
      if (path === "/start") {
        if (room.session.status !== "waiting") return json({ error: "This exam has already started." }, 409);
        room.session.status = "in_progress";
        room.session.current_question_index = 0;
      } else if (path === "/next") {
        if (room.session.status !== "in_progress") return json({ error: "This exam is not in progress." }, 409);
        if (Number(input.currentIndex) !== room.session.current_question_index) return json({ error: "The question has already changed." }, 409);
        room.session.current_question_index += 1;
      } else {
        room.session.status = "completed";
      }
      await this.state.storage.put("room", room);
      return json({ session: room.session });
    }

    if (path === "/answers" && request.method === "POST") {
      const participant = room.participants.find((item) => item.id === input?.participantId);
      if (!participant) return json({ error: "Participant not found." }, 404);
      if (room.session.status !== "in_progress" || Number(input.questionIndex) !== room.session.current_question_index) {
        return json({ error: "That question is no longer active." }, 409);
      }
      const duplicate = room.answers.some((answer) =>
        answer.participant_id === participant.id && answer.question_index === room.session.current_question_index,
      );
      if (duplicate) return json({ accepted: true, duplicate: true });
      const correct = input.isCorrect === true;
      room.answers.push({
        id: crypto.randomUUID(), session_id: room.session.id, participant_id: participant.id,
        question_index: room.session.current_question_index,
        selected_answer: String(input.selectedAnswer ?? "").slice(0, 500),
        is_correct: correct, answered_at: new Date().toISOString(),
      });
      if (correct) participant.score += 10;
      await this.state.storage.put("room", room);
      return json({ accepted: true });
    }

    return json({ error: "Not found." }, 404);
  }
}

function validName(value) {
  return typeof value === "string" && value.trim().length > 0 && value.trim().length <= 40;
}

function isHost(room, participantId) {
  return room.participants.some((participant) => participant.id === participantId && participant.is_host);
}

function withCors(response, request) {
  const headers = new Headers(response.headers);
  headers.set("access-control-allow-origin", request.headers.get("origin") ?? "*");
  headers.set("access-control-allow-methods", "GET, POST, OPTIONS");
  headers.set("access-control-allow-headers", "content-type");
  headers.set("vary", "origin");
  return new Response(response.body, { status: response.status, headers });
}
