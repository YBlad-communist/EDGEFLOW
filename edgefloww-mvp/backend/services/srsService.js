import axios from "axios";

const SRS_API_URL = process.env.SRS_API_URL || "http://localhost:1985";
const SRS_API_SECRET = process.env.SRS_API_SECRET || "";

export async function checkStreamActive(streamKey) {
  try {
    const { data } = await axios.post(`${SRS_API_URL}/api/v1/streams/get`, {
      secret: SRS_API_SECRET || undefined,
      stream: streamKey,
    });
    return data?.code === 0 && data?.stream?.active;
  } catch {
    return false;
  }
}

export async function getStreamInfo(streamKey) {
  try {
    const { data } = await axios.post(`${SRS_API_URL}/api/v1/streams/get`, {
      secret: SRS_API_SECRET || undefined,
      stream: streamKey,
    });
    return data?.code === 0 ? data.stream : null;
  } catch {
    return null;
  }
}

export function buildHlsUrl(streamKey) {
  const srsOrigin = process.env.SRS_ORIGIN || "http://localhost:8080";
  return `${srsOrigin}/live/${streamKey}.m3u8`;
}

export function buildRtmpUrl(streamKey) {
  const rtmpHost = process.env.SRS_RTMP_HOST || "rtmp://localhost/live";
  return `${rtmpHost}/${streamKey}`;
}

export function generateStreamKey() {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let key = "";
  for (let i = 0; i < 24; i++) key += chars[Math.floor(Math.random() * chars.length)];
  return key;
}
