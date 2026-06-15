import axios from "axios";
import config from "../config/index.js";

const SRS_API_SECRET = process.env.SRS_API_SECRET || "";

export async function checkStreamActive(streamKey) {
  try {
    const { data } = await axios.post(`${config.srsApiUrl}/api/v1/streams/get`, {
      secret: SRS_API_SECRET || undefined,
      stream: streamKey,
    });
    return data?.code === 0 && data?.stream?.active;
  } catch { return false; }
}

export async function getStreamInfo(streamKey) {
  try {
    const { data } = await axios.post(`${config.srsApiUrl}/api/v1/streams/get`, {
      secret: SRS_API_SECRET || undefined,
      stream: streamKey,
    });
    return data?.code === 0 ? data.stream : null;
  } catch { return null; }
}

export function buildHlsUrl(streamKey) {
  return `${config.srsOrigin}/live/${streamKey}.m3u8`;
}

export function buildRtmpUrl(streamKey) {
  return `${config.srsRtmpHost}/${streamKey}`;
}

export function generateStreamKey() {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let key = "";
  for (let i = 0; i < 24; i++) key += chars[Math.floor(Math.random() * chars.length)];
  return key;
}
