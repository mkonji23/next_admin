const { connectToDatabase } = require('../mongoClient');
const { ObjectId } = require('mongodb');

// Helper to get collection
const getCollection = async (collectionName) => {
const { db } = await connectToDatabase('choiMath');
return db.collection(collectionName);
};

/\*\*

-   공유 링크 생성
-   @param {Object} shareData - 공유 데이터
-   @param {string} shareData.shareTitle - 공유 제목 (카카오 표시용)
-   @param {string} shareData.shareContent - 공유 내용 (카카오 표시용)
-   @param {string[]} shareData.shareImageUrls - 공유 이미지 URL 배열
-   @param {string} shareData.actualTitle - 실제 상세 제목
-   @param {string} shareData.actualContent - 실제 상세 내용
-   @returns {Promise<Object>}
    \*/
    const createShare = async (shareData) => {
    try {
    const shareCollection = await getCollection('share_board');
    const newShare = {
    ...shareData,
    createdDate: new Date(),
    };
    const result = await shareCollection.insertOne(newShare);
    return { acknowledged: result.acknowledged, insertedId: result.insertedId };
    } catch (error) {
    console.error('Error creating share:', error);
    return { error: 'Internal Server Error', message: error.message };
    }
    };

/\*\*

-   공유 링크 목록 조회
-   @returns {Promise<Array<Object>>}
    \*/
    const getShareList = async () => {
    try {
    const shareCollection = await getCollection('share_board');
    return await shareCollection.find({}).sort({ createdDate: -1 }).toArray();
    } catch (error) {
    console.error('Error fetching share list:', error);
    return { error: 'Internal Server Error', message: error.message };
    }
    };

const axios = require('axios');

/\*\*

-   공유 링크 상세 조회
-   @param {string} id - 공유 링크 ID
-   @returns {Promise<Object>}
    \*/
    const getShareDetail = async (id) => {
    try {
    const shareCollection = await getCollection('share_board');
    const share = await shareCollection.findOne({ \_id: new ObjectId(id) });
    if (!share) {
    return { error: 'Not Found', message: 'Share not found' };
    }
    return share;
    } catch (error) {
    console.error('Error fetching share detail:', error);
    return { error: 'Internal Server Error', message: error.message };
    }
    };

/\*\*

-   공유 링크 삭제 (이미지 포함)
-   @param {string} id - 공유 링크 ID
-   @returns {Promise<Object>}
    \*/
    const deleteShare = async (id) => {
    try {
    const shareCollection = await getCollection('share_board');
    const share = await shareCollection.findOne({ \_id: new ObjectId(id) });

        if (!share) {
          return { error: 'Not Found', message: 'Share not found' };
        }

        // 1. ImageKit에서 이미지 삭제
        if (share.shareImageUrls && share.shareImageUrls.length > 0) {
          const fileIds = share.shareImageUrls
            .map((img) => (typeof img === 'object' ? img.fileId : null))
            .filter((id) => id !== null);

          if (fileIds.length > 0) {
            const auth = Buffer.from(
              process.env.IMAGEKIT_PRIVATE_KEY + ':',
            ).toString('base64');

            try {
              await axios.post(
                'https://api.imagekit.io/v1/files/batch/deleteByFileIds',
                { fileIds },
                {
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Basic ${auth}`,
                  },
                },
              );
            } catch (imgError) {
              console.error(
                'ImageKit Delete Error:',
                imgError.response ? imgError.response.data : imgError.message,
              );
              // 이미지 삭제 실패해도 DB 삭제는 진행 (또는 정책에 따라 변경 가능)
            }
          }
        }

        // 2. DB에서 문서 삭제
        const result = await shareCollection.deleteOne({ _id: new ObjectId(id) });
        return {
          message: 'Share deleted successfully',
          deletedCount: result.deletedCount,
        };

    } catch (error) {
    console.error('Error deleting share:', error);
    return { error: 'Internal Server Error', message: error.message };
    }
    };

/\*\*

-   공유 링크 수정
-   @param {string} id - 공유 링크 ID
-   @param {Object} updateData - 업데이트할 데이터
-   @returns {Promise<Object>}
    \*/
    const updateShare = async (id, updateData) => {
    try {
    const shareCollection = await getCollection('share_board');
    const result = await shareCollection.updateOne(
    { \_id: new ObjectId(id) },
    { $set: { ...updateData, updatedDate: new Date() } },
    );

        if (result.matchedCount === 0) {
          return { error: 'Not Found', message: 'Share not found' };
        }

        return {
          message: 'Share updated successfully',
          modifiedCount: result.modifiedCount,
        };

    } catch (error) {
    console.error('Error updating share:', error);
    return { error: 'Internal Server Error', message: error.message };
    }
    };

module.exports = {
createShare,
getShareList,
getShareDetail,
deleteShare,
updateShare,
};
