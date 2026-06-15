const axios = require('axios');

const SRS_API = process.env.SRS_API_URL || 'http://srs:1985';

const srsService = {
  async isStreamActive(streamKey) {
    try {
      const res = await axios.get(`${SRS_API}/api/v1/streams`, { timeout: 3000 });
      const streams = res.data?.streams || [];
      return streams.some((s) => s.name === streamKey && s.publish?.active);
    } catch (e) {
      return false;
    }
  },

  getHlsUrl(streamKey) {
    const base = SRS_API.replace(':1985', ':8080');
    return `${base}/live/${streamKey}.m3u8`;
  },

  getRtmpUrl(streamKey) {
    const host = (process.env.SRS_RTMP_URL || 'rtmp://localhost:1935/live').replace(/\/[^/]*$/, '');
    return `${host}/${streamKey}`;
  },
};

module.exports = srsService;
