const express = require('express');
const router = express.Router();
const {
getClass,
saveClass,
updateClass,
deleteClass,
} = require('../../services/choiMath/classService');

/\*\*

-   @api {get} /api/choiMath/class/ 클래스 목록 조회
-   @apiName GetClassList
-   @apiGroup choiMath-class
-
-   @apiSuccess {Object[]} classes 클래스 목록.
-
-   @apiSuccessExample 성공-응답:
-       HTTP/1.1 200 OK
-       [
-         {
-           "classId": "C001",
-           "className": "Math Level 1",
-           "teacher": "Mr. Choi",
-           "students": [],
-           "description": "Basic math class"
-         }
-       ]
    \*/
    router.get('/', async (req, res) => {
    const result = await getClass();
    if (result.error) {
    return res.status(500).json(result);
    }
    res.status(200).json(result);
    });

/\*\*

-   @api {get} /api/choiMath/class/:classId 클래스 상세 조회
-   @apiName GetClass
-   @apiGroup choiMath-class
-
-   @apiParam {String} classId 클래스 ID.
-
-   @apiSuccess {Object} class 클래스 정보.
    \*/
    router.get('/:classId', async (req, res) => {
    const { classId } = req.params;
    const result = await getClass(classId);
    if (result.error) {
    return res.status(500).json(result);
    }
    if (!result) {
    return res.status(404).json({ error: 'Class not found' });
    }
    res.status(200).json(result);
    });

/\*\*

-   @api {post} /api/choiMath/class/ 클래스 저장
-   @apiName SaveClass
-   @apiGroup choiMath-class
-
-   @apiParam {String} classId 클래스 ID.
-   @apiParam {String} className 클래스 이름.
-   @apiParam {String} teacher 담당 선생님.
-   @apiParam {Array} [students] 학생 목록.
-   @apiParam {String} createdId 생성자 ID.
-   @apiParam {String} [description] 설명.
-
-   @apiSuccess {Boolean} acknowledged 성공 여부.
-   @apiSuccess {String} insertedId 삽입된 ID.
    \*/
    router.post('/', async (req, res) => {
    const result = await saveClass(req.body);
    if (result.error) {
    return res.status(500).json(result);
    }
    res.status(201).json(result);
    });

/\*\*

-   @api {post} /api/choiMath/class/update 클래스 수정
-   @apiName UpdateClass
-   @apiGroup choiMath-class
-
-   @apiParam {String} classId 클래스 ID.
-   @apiParam {String} [className] 클래스 이름.
-   @apiParam {String} [teacher] 담당 선생님.
-   @apiParam {Array} [students] 학생 목록.
-   @apiParam {String} updateId 수정자 ID.
-   @apiParam {String} [description] 설명.
-
-   @apiSuccess {String} message 성공 메시지.
-   @apiSuccess {Number} modifiedCount 수정된 수.
    \*/
    router.post('/update', async (req, res) => {
    const { classId } = req.body;
    const result = await updateClass(classId, req.body);
    if (result.error) {
    if (result.error === 'Class not found') {
    return res.status(404).json(result);
    }
    if (result.error === 'Bad Request') {
    return res.status(400).json(result);
    }
    return res.status(500).json(result);
    }
    res.status(200).json(result);
    });

/\*\*

-   @api {post} /api/choiMath/class/delete 클래스 삭제
-   @apiName DeleteClass
-   @apiGroup choiMath-class
-
-   @apiParam {String} classId 클래스 ID.
-
-   @apiSuccess {String} message 성공 메시지.
-   @apiSuccess {Number} deletedCount 삭제된 수.
    \*/
    router.post('/delete', async (req, res) => {
    const { classId } = req.body;
    const result = await deleteClass(classId);
    if (result.error) {
    if (result.error === 'Class not found') {
    return res.status(404).json(result);
    }
    return res.status(500).json(result);
    }
    res.status(200).json(result);
    });

module.exports = router;
