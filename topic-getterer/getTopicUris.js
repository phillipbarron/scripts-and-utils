const axios = require('axios');
const fs = require('fs');
const https = require('https');

const topicIds = require('./topicids.json');


const flattenedTopicIds = topicIds.map(topicId => topicId.topicId);

const getClientCertificates = () => {
  const certificate = process.env.DEV_CERT_PEM
  const clientKey = process.env.DEV_CERT_PEM
  const certificateAuthority = process.env.COSMOS_CA
  return {
    cert: fs.readFileSync(certificate),
    key: fs.readFileSync(clientKey),
    ca: fs.readFileSync(certificateAuthority),
  };
};

const getTopic = async (topicId) => {
  const httpsAgent = new https.Agent({
    ...getClientCertificates(),
  });

  const response = await axios.get(
    `https://tipo.api.bbci.co.uk/topic?id=${topicId}`,
    {
      httpsAgent,
    },
  );
  const thing = response.data.results[0];
  return thing;
};


const getStreamUris = async (topicIds) => {
    const curationUris = [];
    const troubleMakers = [];
    for(const topicId of topicIds) {
        try {
            const { curationList } = await getTopic(topicId);
            if (curationList.length === 1){
                curationUris.push(`https://vivo.tools.bbc.co.uk/#/stream/tag/${curationList[0].curationId}`);
            } else {
                troubleMakers.push({ topicId, curationList});
            }
        } catch (error) {
            troubleMakers.push({ errMessage: error.message, topicId });
        }
    }

    if (troubleMakers.length) {
        console.log('some stuff failed', JSON.stringify(troubleMakers, null, 2));
    }
    console.log('and the stuff is', JSON.stringify(curationUris, null, 2));
    console.log('\nfin\n');
}

getStreamUris(flattenedTopicIds);
