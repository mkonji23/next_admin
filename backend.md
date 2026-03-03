// @ts-check
const express = require('express');
const router = express.Router();
const {
getStudentList,
saveStudent,
updateStudent,
deleteStudent,
deleteStudents,
} = require('../../services/choiMath/studentService');

/\*\*

-   @api {get} /api/choiMath/student/getStudentList 학생 목록 조회
-   @apiName GetStudentList
-   @apiGroup choiMath
-   @apiParam {String} [studentId] 학생 ID로 검색 (선택 사항).
-   @apiParam {String} [name] 학생 이름으로 검색 (선택 사항).
-   @apiParam {String} [grade] 학년으로 검색 (선택 사항).
-   @apiParam {String} [school] 학교로 검색 (선택 사항).
-
-   @apiSuccess {Object[]} students 학생 목록.
-   @apiSuccess {String} students.studentId 학생 ID.
-   @apiSuccess {String} students.name 학생 이름.
-   @apiSuccess {String} students.grade 학년.
-   @apiSuccess {String} students.school 학교.
-   @apiSuccess {String} students.phoneNumber 학생 전화번호.
-   @apiSuccess {String} students.parentPhoneNumber 학부모 전화번호.
-   @apiSuccess {String} students.description 설명.
-   @apiSuccess {String} students.registDate 등록일자 (YYYYMMDD 형식).
-   @apiSuccess {Boolean} students.isWithdrawn 퇴원여부.
-   @apiSuccess {Object[]} students.classes 수강 중인 수업 목록.
-   @apiSuccess {String} students.classes.classId 클래스 ID.
-   @apiSuccess {String} students.classes.className 클래스 이름.
-   @apiSuccess {String} students.classes.teacher 담당 선생님.
-   @apiSuccess {String} students.classes.startDate 개강일시 (YYYYMMDD 형식).
-   @apiSuccess {String} students.classes.endDate 종강일시 (YYYYMMDD 형식).
-   @apiSuccess {String} students.classes.description 클래스 설명.
-   @apiSuccess {Date} students.createdDate 생성 날짜.
-   @apiSuccess {Date} students.updatedDate 수정 날짜.
-
-   @apiSuccessExample 성공-응답:
-       HTTP/1.1 200 OK
-       [
-         {
-           "studentId": "STU-12345678-1234-1234-1234-123456789012",
-           "name": "홍길동",
-           "grade": "1",
-           "school": "서울초등학교",
-           "description": "설명",
-           "registDate": "20240101",
-           "isWithdrawn": false,
-           "classes": [
-             {
-               "classId": "class-xxx",
-               "className": "수학 기초반",
-               "teacher": "최선생",
-               "startDate": "20240101",
-               "endDate": "20241231",
-               "description": "기초 수학 수업"
-             }
-           ],
-           "createdDate": "2023-01-01T00:00:00.000Z",
-           "updatedDate": "2023-01-01T00:00:00.000Z"
-         }
-       ]
-
-   @apiError {String} error 오류 유형.
-   @apiError {String} message 오류 설명.
-
-   @apiErrorExample 오류-응답 (서버 오류):
-       HTTP/1.1 500 Internal Server Error
-       {
-          "error": "Internal Server Error",
-          "message": "..."
-       }
    \*/
    router.get('/getStudentList', async (req, res) => {
    const result = await getStudentList(req.query);

// @ts-ignore
if (result.error) {
return res.status(500).json(result);
}

res.status(200).json(result);
});

/\*\*

-   @api {post} /api/choiMath/student/saveStudent 학생 등록 (단건/다건)
-   @apiName SaveStudent
-   @apiGroup choiMath
-
-   @apiDescription 단건 또는 다건 학생 등록이 가능합니다.
-
-   @apiParam {Object|Object[]} data 학생 데이터 (단건 객체 또는 배열).
-   @apiParam {String} data.name 학생 이름 (필수).
-   @apiParam {String} data.grade 학년 (필수).
-   @apiParam {String} data.school 학교 (필수).
-   @apiParam {String} [data.phoneNumber] 학생 전화번호 (선택).
-   @apiParam {String} [data.parentPhoneNumber] 학부모 전화번호 (선택).
-   @apiParam {String} [data.description] 설명 (선택).
-   @apiParam {String} [data.registDate] 등록일자 YYYYMMDD 형식 (선택, 미입력시 현재 날짜).
-   @apiParam {Boolean} [data.isWithdrawn] 퇴원여부 (선택, 기본값 false).
-
-   @apiSuccess {Boolean} acknowledged 명령이 승인되었는지 여부.
-   @apiSuccess {String} insertedId 삽입된 문서의 ID (단건일 경우).
-   @apiSuccess {Number} insertedCount 삽입된 문서 수 (다건일 경우).
-   @apiSuccess {Object} insertedIds 삽입된 문서의 ID 객체 (다건일 경우).
-
-   @apiSuccessExample 성공-응답 (단건):
-       HTTP/1.1 201 Created
-       {
-         "acknowledged": true,
-         "insertedId": "60c72b2f9b1d8c001f8e4d4b"
-       }
-
-   @apiSuccessExample 성공-응답 (다건):
-       HTTP/1.1 201 Created
-       {
-         "acknowledged": true,
-         "insertedCount": 3,
-         "insertedIds": {
-           "0": "60c72b2f9b1d8c001f8e4d4b",
-           "1": "60c72b2f9b1d8c001f8e4d4c",
-           "2": "60c72b2f9b1d8c001f8e4d4d"
-         }
-       }
-
-   @apiError {String} error 오류 유형.
-   @apiError {String} message 오류 설명.
-
-   @apiErrorExample 오류-응답 (잘못된 요청):
-       HTTP/1.1 400 Bad Request
-       {
-          "error": "Bad Request",
-          "message": "Name, grade, and school are required."
-       }
-
-   @apiErrorExample 오류-응답 (서버 오류):
-       HTTP/1.1 500 Internal Server Error
-       {
-          "error": "Internal Server Error",
-          "message": "..."
-       }
    \*/
    router.post('/saveStudent', async (req, res) => {
    const { data } = req.body;
    let studentData;

// data 필드가 있으면 data를 사용, 없으면 req.body를 직접 사용 (하위 호환성)
if (data !== undefined) {
studentData = data;
} else {
// 기존 방식 지원: name, grade, school을 직접 받는 경우
const { name, grade, school, description } = req.body;
if (name || grade || school) {
studentData = { name, grade, school, description };
} else {
return res.status(400).json({
error: 'Bad Request',
message: 'Student data is required.',
});
}
}

// 배열이 아닌 경우 유효성 검사
if (!Array.isArray(studentData)) {
if (!studentData.name || !studentData.grade || !studentData.school) {
return res.status(400).json({
error: 'Bad Request',
message: 'Name, grade, and school are required.',
});
}
}

const result = await saveStudent(studentData);
if (result.error) {
if (result.error === 'Bad Request') {
return res.status(400).json(result);
}
return res.status(500).json(result);
}

res.status(201).json(result);
});

/\*\*

-   @api {post} /api/choiMath/student/updateStudent 학생 정보 수정
-   @apiName UpdateStudent
-   @apiGroup choiMath
-
-   @apiParam {String} studentId 학생 고유 ID (필수).
-   @apiParam {String} [name] 학생 이름 (선택).
-   @apiParam {String} [grade] 학년 (선택).
-   @apiParam {String} [school] 학교 (선택).
-   @apiParam {String} [phoneNumber] 학생 전화번호 (선택).
-   @apiParam {String} [parentPhoneNumber] 학부모 전화번호 (선택).
-   @apiParam {String} [description] 설명 (선택).
-   @apiParam {String} [registDate] 등록일자 YYYYMMDD 형식 (선택).
-   @apiParam {Boolean} [isWithdrawn] 퇴원여부 (선택).
-
-   @apiSuccess {String} message 성공 메시지.
-   @apiSuccess {Number} modifiedCount 수정된 문서 수.
-
-   @apiSuccessExample 성공-응답:
-       HTTP/1.1 200 OK
-       {
-         "message": "Student updated successfully",
-         "modifiedCount": 1
-       }
-
-   @apiError {String} error 오류 유형.
-   @apiError {String} message 오류 설명.
-
-   @apiErrorExample 오류-응답 (학생 없음):
-       HTTP/1.1 404 Not Found
-       {
-         "error": "Student not found"
-       }
-   @apiErrorExample 오류-응답 (잘못된 요청):
-       HTTP/1.1 400 Bad Request
-       {
-         "error": "Bad Request",
-         "message": "No fields to update"
-       }
    \*/
    router.post('/updateStudent', async (req, res) => {
    const { studentId, ...updateData } = req.body;

if (!studentId) {
return res
.status(400)
.json({ error: 'Bad Request', message: 'Student ID is required.' });
}

const result = await updateStudent(studentId, updateData);
if (result.error) {
if (result.error === 'Student not found') {
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

-   @api {post} /api/choiMath/student/deleteStudent 학생 삭제
-   @apiName DeleteStudent
-   @apiGroup choiMath
-
-   @apiParam {String} studentId 학생 고유 ID (필수).
-
-   @apiSuccess {String} message 성공 메시지.
-   @apiSuccess {Number} deletedCount 삭제된 문서 수.
-
-   @apiSuccessExample 성공-응답:
-       HTTP/1.1 200 OK
-       {
-         "message": "Student deleted successfully",
-         "deletedCount": 1
-       }
-
-   @apiError {String} error 오류 유형.
-   @apiError {String} message 오류 설명.
-
-   @apiErrorExample 오류-응답 (학생 없음):
-       HTTP/1.1 404 Not Found
-       {
-         "error": "Student not found"
-       }
    \*/
    router.post('/deleteStudent', async (req, res) => {
    const { studentId } = req.body;

if (!studentId) {
return res
.status(400)
.json({ error: 'Bad Request', message: 'Student ID is required.' });
}

const result = await deleteStudent(studentId);
if (result.error) {
if (result.error === 'Student not found') {
return res.status(404).json(result);
}
return res.status(500).json(result);
}

res.status(200).json(result);
});

/\*\*

-   @api {post} /api/choiMath/student/deleteStudents 여러 학생 삭제
-   @apiName DeleteStudents
-   @apiGroup choiMath
-
-   @apiParam {Object} data 요청 데이터 객체.
-   @apiParam {String[]} data.studentIds 삭제할 학생 ID 배열 (필수).
-
-   @apiSuccess {String} message 성공 메시지.
-   @apiSuccess {Number} deletedCount 삭제된 문서 수.
-
-   @apiSuccessExample 성공-응답:
-       HTTP/1.1 200 OK
-       {
-         "message": "Students deleted successfully",
-         "deletedCount": 3
-       }
-
-   @apiError {String} error 오류 유형.
-   @apiError {String} message 오류 설명.
-
-   @apiErrorExample 오류-응답 (잘못된 요청):
-       HTTP/1.1 400 Bad Request
-       {
-         "error": "Bad Request",
-         "message": "Student IDs array is required and must not be empty."
-       }
-   @apiErrorExample 오류-응답 (서버 오류):
-       HTTP/1.1 500 Internal Server Error
-       {
-         "error": "Internal Server Error",
-         "message": "..."
-       }
    \*/
    router.post('/deleteStudents', async (req, res) => {
    const { data } = req.body;
    const studentIds = data?.studentIds;

if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
return res.status(400).json({
error: 'Bad Request',
message: 'Student IDs array is required and must not be empty.',
});
}

const result = await deleteStudents(studentIds);
if (result.error) {
if (result.error === 'Bad Request') {
return res.status(400).json(result);
}
return res.status(500).json(result);
}

res.status(200).json(result);
});

module.exports = router;
