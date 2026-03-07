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

-   ImageKit에서 이미지 삭제를 위한 헬퍼 함수
-   @param {Array} shareImageUrls - 삭제할 이미지 정보 배열
    \*/
    const deleteImagesFromImageKit = async (shareImageUrls) => {
    if (shareImageUrls && shareImageUrls.length > 0) {
    const fileIds = shareImageUrls
    .map((img) => (typeof img === 'object' ? img.fileId : null))
    .filter((id) => id !== null);

        if (fileIds.length > 0) {
          const auth = Buffer.from(process.env.IMAGEKIT_PRIVATE_KEY + ':').toString(
            'base64',
          );

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
          }
        }

    }
    };

/\*\*

-   공유 링크 다건 삭제 (이미지 포함)
-   @param {string[]} ids - 공유 링크 ID 배열
-   @returns {Promise<Object>}
    \*/
    const deleteShares = async (ids) => {
    try {
    const shareCollection = await getCollection('share_board');
    const objectIds = ids.map((id) => new ObjectId(id));

        // 1. 삭제할 문서들의 이미지 정보 조회
        const shares = await shareCollection
          .find({ _id: { $in: objectIds } })
          .toArray();

        if (shares.length === 0) {
          return { error: 'Not Found', message: 'No shares found to delete' };
        }

        // 2. 각 문서의 ImageKit 이미지 삭제
        for (const share of shares) {
          await deleteImagesFromImageKit(share.shareImageUrls);
        }

        // 3. DB에서 문서들 삭제
        const result = await shareCollection.deleteMany({ _id: { $in: objectIds } });
        return {
          message: `${result.deletedCount} shares deleted successfully`,
          deletedCount: result.deletedCount,
        };

    } catch (error) {
    console.error('Error deleting shares:', error);
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

        // 새 이미지가 포함된 경우 기존 이미지 삭제
        if (updateData.shareImageUrls) {
          const existingShare = await shareCollection.findOne({
            _id: new ObjectId(id),
          });
          if (existingShare) {
            await deleteImagesFromImageKit(existingShare.shareImageUrls);
          }
        }

        const result = await shareCollection.updateOne(
          { _id: new ObjectId(id) },
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

/\*\*

-   공유 링크 상세 조회 인증용
-   @param {string} id - 공유 링크 ID
-   @param {string} pwd - 비교할 전화번호 (비밀번호 역할)
-   @param {string} type - 'student' 또는 'parent'
-   @returns {Promise<Object>}
    \*/
    const checkShareDetailWithAuth = async (id, pwd, type) => {
    try {
    const shareCollection = await getCollection('share_board');
    const share = await shareCollection.findOne({ \_id: new ObjectId(id) });

        if (!share) {
          return { error: 'Not Found', message: 'Share not found' };
        }

        if (type === 'student') {
          if (share.telNo !== pwd) {
            return {
              error: 'Unauthorized',
              message: '전화번호가 일치하지 않습니다.',
            };
          }
        } else if (type === 'parent') {
          if (share.pTelNo !== pwd) {
            return {
              error: 'Unauthorized',
              message: '학부모 전화번호가 일치하지 않습니다.',
            };
          }
        } else {
          return { error: 'Bad Request', message: 'Invalid type' };
        }

        return { success: true, message: '인증에 성공했습니다.' };

    } catch (error) {
    console.error('Error fetching share detail with auth:', error);
    return { error: 'Internal Server Error', message: error.message };
    }
    };

module.exports = {
createShare,
getShareList,
getShareDetail,
deleteShares,
updateShare,
checkShareDetailWithAuth,
};
