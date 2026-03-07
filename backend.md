const express = require('express');
const router = express.Router();
const axios = require('axios');
const multer = require('multer');
const FormData = require('form-data');
const upload = multer({ storage: multer.memoryStorage() });

const {
createShare,
getShareList,
getShareDetail,
} = require('../../services/choiMath/shareService');

/\*\*

-   @api {post} /api/choiMath/share/create 공유 링크 생성 (이미지 업로드 포함)
-   @apiName CreateShare
-   @apiGroup choiMath/share
    \*/
    router.post('/create', upload.array('files'), async (req, res) => {
    console.log('없나?');
    const { shareTitle, shareContent, actualTitle, actualContent } = req.body;
    const files = req.files;

console.log('files', files);
if (!shareTitle || !shareContent || !actualTitle || !actualContent) {
return res
.status(400)
.json({ error: 'Bad Request', message: 'Required fields missing' });
}

const shareImageUrls = [];

console.log(
'process.env.IMAGEKIT_PUBLIC_KEY',
process.env.IMAGEKIT_PUBLIC_KEY,
);
try {
// ImageKit 업로드 처리
if (files && files.length > 0) {
for (const file of files) {
const form = new FormData();
form.append('file', file.buffer.toString('base64'));
form.append('fileName', file.originalname);
form.append('publicKey', process.env.IMAGEKIT_PUBLIC_KEY);
form.append('useUniqueFileName', 'true');
form.append('tags', 'share_board');

        const auth = Buffer.from(
          process.env.IMAGEKIT_PRIVATE_KEY + ':',
        ).toString('base64');

        const response = await axios.post(
          'https://upload.imagekit.io/api/v1/files/upload',
          form,
          {
            headers: {
              ...form.getHeaders(),
              Authorization: `Basic ${auth}`,
            },
          },
        );

        console.log('response', response);

        if (response.data && response.data.url) {
          shareImageUrls.push(response.data.url);
        }
      }
    }

    const result = await createShare({
      shareTitle,
      shareContent,
      shareImageUrls,
      actualTitle,
      actualContent,
    });

    if (result.error) return res.status(500).json(result);
    res.status(201).json(result);

} catch (error) {
console.error(
'ImageKit Upload/Create Error:',
error.response ? error.response.data : error.message,
);
res.status(500).json({
error: 'Internal Server Error',
message: 'Failed to upload images or save data',
});
}
});

/\*\*

-   @api {get} /api/choiMath/share/list 공유 링크 목록 조회
-   @apiName GetShareList
-   @apiGroup choiMath/share
    \*/
    router.get('/list', async (req, res) => {
    const result = await getShareList();
    if (result.error) return res.status(500).json(result);
    res.status(200).json(result);
    });

/\*\*

-   @api {get} /api/choiMath/share/detail/:id 공유 링크 상세 조회
-   @apiName GetShareDetail
-   @apiGroup choiMath/share
    \*/
    router.get('/detail/:id', async (req, res) => {
    const { id } = req.params;
    const result = await getShareDetail(id);
    if (result.error) {
    if (result.error === 'Not Found') return res.status(404).json(result);
    return res.status(500).json(result);
    }
    res.status(200).json(result);
    });

module.exports = router;
