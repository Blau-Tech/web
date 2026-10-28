export function database(url, key, fetcher = fetch) {
  /** @param {string} path @param {{method?:string,body?:unknown,prefer?:string,idempotencyKey?:string,allow404?:boolean}} options */
  async function request(path, { method = "GET", body, prefer } = {}) {
    const response = await fetcher(`${url}/rest/v1/${path}`, {
      method,
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        ...(prefer ? { Prefer: prefer } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error(`database_${response.status}`);
    return response.status === 204
      ? null
      : JSON.parse((await response.text()) || "null");
  }
  const rpc = (name, body) => request("rpc/" + name, { method: "POST", body });
  const patch = (table, query, body) =>
    request(table + "?" + query, {
      method: "PATCH",
      body,
      prefer: "return=representation",
    });
  return {
    request,
    rpc,
    patch,
    store: {
      find: async (key) =>
        (
          await request(
            "newsletter_campaigns?issue_key=eq." +
              encodeURIComponent(key) +
              "&limit=1",
          )
        )[0],
      claim: async (body) =>
        (
          await request("newsletter_campaigns?on_conflict=issue_key", {
            method: "POST",
            body,
            prefer: "resolution=ignore-duplicates,return=representation",
          })
        )[0],
      update: async (id, body) => {
        const rows = await patch("newsletter_campaigns", "id=eq." + id, {
          ...body,
          updated_at: new Date().toISOString(),
        });
        if (rows.length !== 1) throw new Error("campaign_update_missing");
      },
      complete: (id, broadcast) =>
        rpc("newsletter_complete_campaign", {
          p_id: id,
          p_broadcast_id: broadcast,
        }),
    },
  };
}

export function resend(key, fetcher = fetch) {
  let lastRequest = 0;
  /** @param {string} path @param {{method?:string,body?:unknown,prefer?:string,idempotencyKey?:string,allow404?:boolean}} options */
  async function request(
    path,
    { method = "GET", body, idempotencyKey, allow404 = false } = {},
  ) {
    // Stay below the default account rate limit within this worker. Provider 429s remain observable.
    const delay = 600 - (Date.now() - lastRequest);
    if (delay > 0) await new Promise((resolve) => setTimeout(resolve, delay));
    lastRequest = Date.now();
    const response = await fetcher("https://api.resend.com/" + path, {
      method,
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    });
    if (allow404 && response.status === 404) return null;
    if (!response.ok) throw new Error(`resend_${response.status}`);
    return JSON.parse((await response.text()) || "null");
  }
  async function list(path, max = 1000) {
    let after,
      rows = [];
    for (let page = 0; page < 11; page++) {
      const result = await request(
        path +
          "?limit=100" +
          (after ? "&after=" + encodeURIComponent(after) : ""),
      );
      if (!Array.isArray(result.data)) throw new Error("invalid_resend_list");
      rows.push(...result.data);
      if (rows.length > max) throw new Error("free_contact_limit_exceeded");
      if (!result.has_more) return rows;
      const next = result.data.at(-1)?.id;
      if (!next || next === after) throw new Error("invalid_resend_pagination");
      after = next;
    }
    throw new Error("free_contact_limit_exceeded");
  }
  return {
    request,
    list,
    create: (body) => request("broadcasts", { method: "POST", body }),
    send: (id) =>
      request("broadcasts/" + id + "/send", { method: "POST", body: {} }),
    get: (id) => request("broadcasts/" + id),
    assertAudience: async (id, max) => {
      await list("contacts", max);
      const contacts = await list("segments/" + id + "/contacts", max);
      if (!contacts.some((c) => c.unsubscribed === false))
        throw new Error("no_subscribed_contacts");
    },
  };
}
