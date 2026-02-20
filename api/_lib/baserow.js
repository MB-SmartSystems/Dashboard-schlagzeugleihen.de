export async function baserowFetch(path, options = {}) {
  const url = `${process.env.BASEROW_URL}${path}`;
  const headers = {
    Authorization: `Token ${process.env.BASEROW_TOKEN}`,
    ...options.headers,
  };
  if (options.body) {
    headers["Content-Type"] = "application/json";
  }
  return fetch(url, { ...options, headers });
}
