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
deleteShares,
updateShare,
checkShareDetailWithAuth,
} = require('../../services/choiMath/shareService');

/\*\*

-   @api {post} /api/choiMath/share/detail-with-auth 공유 링크 상세 조회 (인증 포함)
-   @apiName GetShareDetailWithAuth
-   @apiGroup choiMath/share
    \*/
    router.post('/detail-with-auth', async (req, res) => {
    const { id, pwd, type } = req.body;

if (!pwd || !type) {
return res
.status(400)
.json({ error: 'Bad Request', message: 'Required fields missing' });
}

// pwd(전화번호) 숫자만 추출 및 트리밍
const cleanPwd = pwd.trim().replace(/[^\d]/g, '');

const result = await checkShareDetailWithAuth(id, cleanPwd, type);
if (result.error) {
if (result.error === 'Not Found') return res.status(404).json(result);
if (result.error === 'Unauthorized') return res.status(401).json(result);
return res.status(500).json(result);
}
res.status(200).json(result);
});

/\*\*

-   @api {post} /api/choiMath/share/create 공유 링크 생성 (이미지 업로드 포함)
-   @apiName CreateShare
-   @apiGroup choiMath/share
    \*/
    router.post('/create', upload.array('files'), async (req, res) => {
    const {
    shareTitle,
    shareContent,
    actualTitle,
    actualContent,
    studentId,
    studentName,
    telNo,
    pTelNo,
    } = req.body;
    const files = req.files;

// 전화번호 숫자만 추출 및 트리밍
const cleanTelNo = telNo ? telNo.trim().replace(/[^\d]/g, '') : telNo;
const cleanPTelNo = pTelNo ? pTelNo.trim().replace(/[^\d]/g, '') : pTelNo;

if (!shareTitle || !shareContent || !actualTitle || !actualContent) {
return res
.status(400)
.json({ error: 'Bad Request', message: 'Required fields missing' });
}

const shareImageUrls = [];

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

        if (response.data) {
          shareImageUrls.push(response.data);
        }
      }
    }

    const result = await createShare({
      shareTitle,
      shareContent,
      shareImageUrls,
      actualTitle,
      actualContent,
      studentId,
      studentName,
      telNo: cleanTelNo,
      pTelNo: cleanPTelNo,
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

/\*\*

-   @api {post} /api/choiMath/share/delete 공유 링크 다건 삭제
-   @apiName DeleteShares
-   @apiGroup choiMath/share
    \*/
    router.post('/delete', async (req, res) => {
    const { ids } = req.body;

if (!ids || !Array.isArray(ids) || ids.length === 0) {
return res
.status(400)
.json({ error: 'Bad Request', message: 'IDs array missing or empty' });
}

const result = await deleteShares(ids);
if (result.error) {
if (result.error === 'Not Found') return res.status(404).json(result);
return res.status(500).json(result);
}
res.status(200).json(result);
});

/\*\*

-   @api {post} /api/choiMath/share/update/:id 공유 링크 수정 (이미지 포함)
-   @apiName UpdateShare
-   @apiGroup choiMath/share
    \*/
    router.post('/update/:id', upload.array('files'), async (req, res) => {
    const { id } = req.params;
    const {
    shareTitle,
    shareContent,
    actualTitle,
    actualContent,
    studentId,
    studentName,
    telNo,
    pTelNo,
    } = req.body;
    const files = req.files;

const updateData = {
...(shareTitle && { shareTitle }),
...(shareContent && { shareContent }),
...(actualTitle && { actualTitle }),
...(actualContent && { actualContent }),
...(studentId && { studentId }),
...(studentName && { studentName }),
...(telNo !== undefined && { telNo: telNo.trim().replace(/[^\d]/g, '') }),
...(pTelNo !== undefined && {
pTelNo: pTelNo.trim().replace(/[^\d]/g, ''),
}),
};

try {
// 새 파일이 있는 경우 ImageKit 업로드 처리
if (files && files.length > 0) {
const shareImageUrls = [];
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

        if (response.data) {
          shareImageUrls.push(response.data);
        }
      }
      // 업데이트 데이터에 새 이미지 URL 배열 추가
      updateData.shareImageUrls = shareImageUrls;
    }

    const result = await updateShare(id, updateData);
    if (result.error) {
      if (result.error === 'Not Found') return res.status(404).json(result);
      return res.status(500).json(result);
    }
    res.status(200).json(result);

} catch (error) {
console.error(
'Update Error:',
error.response ? error.response.data : error.message,
);
res.status(500).json({
error: 'Internal Server Error',
message: 'Failed to update share link',
});
}
});

module.exports = router;
