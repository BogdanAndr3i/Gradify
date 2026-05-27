import { auth } from "./firebase";

const BASE_URL = "https://gradify-497616.ew.r.appspot.com";

async function request(method, path, body = null) {
  const token = await auth.currentUser?.getIdToken();
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(`${BASE_URL}${path}`, options);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Eroare server");
  return data;
}

async function upload(path, formData) {
  const token = await auth.currentUser?.getIdToken();
  const headers = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers,
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Eroare server");
  return data;
}

export const api = {
  get:    (path)         => request("GET", path),
  post:   (path, body)   => request("POST", path, body),
  put:    (path, body)   => request("PUT", path, body),
  upload: (path, form)   => upload(path, form),
};