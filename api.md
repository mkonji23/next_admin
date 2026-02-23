// @ts-check
const express = require('express');
const router = express.Router();
const {
insertAttendance,
saveAttendance,
getAttendance,
getAttendanceStatistics,
getStudentAttendanceStatistics,
} = require('../../services/choiMath/attendanceService');

/\*\*

-   @api {post} /api/choiMath/attendance/saveAttendance 출석 저장
-   @apiName SaveAttendance
-   @apiGroup choiMath-attendance
-
-   @apiParam {Object} attendanceData 출석 데이터.
-
-   @apiSuccess {Object} result 결과 객체.
-
-   @apiSuccessExample 성공-응답:
-       HTTP/1.1 201 Created
-       {
-         "acknowledged": true,
-         "modifiedCount": 1,
-         "upsertedId": null,
-         "upsertedCount": 0,
-         "matchedCount": 1
-       }
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
    /\*\*
-   @api {get} /api/choiMath/attendance/getAttendance 출석 조회
-   @apiName GetAttendance
-   @apiGroup choiMath-attendance
-
-   @apiParam {String} [classId] 클래스 ID로 검색 (선택 사항).
-   @apiParam {String} [year] 연도로 검색 (선택 사항).
-   @apiParam {String} [month] 월로 검색 (선택 사항).
-   @apiParam {String} [yearMonth] 연월로 검색 YYYYMM 형식 (선택 사항, year와 month가 없을 때 사용).
-
-   @apiSuccess {Object[]} attendances 출석 목록.
-
-   @apiSuccessExample 성공-응답:
-       HTTP/1.1 200 OK
-       [
-         {
-           "classId": "class-xxx",
-           "year": "2024",
-           "month": "01",
-           "students": []
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
    router.get('/getAttendance', async (req, res) => {
    const result = await getAttendance(req.query);

// @ts-ignore
if (result.error) {
return res.status(500).json(result);
}

res.status(200).json(result);
});

/\*\*

-   @api {post} /api/choiMath/attendance/insertAttendance 출석부 신규 생성
-   @apiName InsertAttendance
-   @apiGroup choiMath-attendance
-
-   @apiParam {String} classId 클래스 ID (필수).
-   @apiParam {String} year 연도 (필수).
-   @apiParam {String} month 월 (필수).
-
-   @apiDescription 클래스의 학생 리스트를 가져와서 신규 출석부를 생성합니다.
-
-   @apiSuccess {Boolean} acknowledged 성공 여부.
-   @apiSuccess {String} insertedId 삽입된 문서의 ID.
-
-   @apiSuccessExample 성공-응답:
-       HTTP/1.1 201 Created
-       {
-         "acknowledged": true,
-         "insertedId": "60c72b2f9b1d8c001f8e4d4b"
-       }
-
-   @apiError {String} error 오류 유형.
-   @apiError {String} message 오류 설명.
-
-   @apiErrorExample 오류-응답 (클래스 없음):
-       HTTP/1.1 404 Not Found
-       {
-          "error": "Class not found",
-          "message": "Class does not exist"
-       }
-
-   @apiErrorExample 오류-응답 (이미 존재):
-       HTTP/1.1 400 Bad Request
-       {
-          "error": "Bad Request",
-          "message": "Attendance already exists for this class, year, and month"
-       }
-
-   @apiErrorExample 오류-응답 (서버 오류):
-       HTTP/1.1 500 Internal Server Error
-       {
-          "error": "Internal Server Error",
-          "message": "..."
-       }
    \*/
    router.post('/insertAttendance', async (req, res) => {
    const { classId, year, month } = req.body;

if (!classId || !year || !month) {
return res.status(400).json({
error: 'Bad Request',
message: 'classId, year, and month are required.',
});
}

const result = await insertAttendance(classId, year, month);

if (result.error) {
if (result.error === 'Class not found') {
return res.status(404).json(result);
}
if (result.error === 'Bad Request') {
return res.status(400).json(result);
}
return res.status(500).json(result);
}

res.status(201).json(result);
});

/\*\*

-   @api {post} /api/choiMath/attendance/saveAttendance 출석 저장
-   @apiName SaveAttendance
-   @apiGroup choiMath-attendance
-
-   @apiParam {String} classId 클래스 ID (필수).
-   @apiParam {String} [year] 연도 (선택, yearMonth가 없으면 필수).
-   @apiParam {String} [month] 월 (선택, yearMonth가 없으면 필수).
-   @apiParam {String} [yearMonth] 연월 YYYYMM 형식 (선택, year와 month가 없을 때 사용).
-   @apiParam {Object} attendanceData 출석 데이터.
-
-   @apiSuccess {Object} result 결과 객체.
-
-   @apiSuccessExample 성공-응답:
-       HTTP/1.1 201 Created
-       {
-         "acknowledged": true,
-         "modifiedCount": 1,
-         "upsertedId": null,
-         "upsertedCount": 0,
-         "matchedCount": 1
-       }
-
-   @apiError {String} error 오류 유형.
-   @apiError {String} message 오류 설명.
-
-   @apiErrorExample 오류-응답 (잘못된 요청):
-       HTTP/1.1 400 Bad Request
-       {
-          "error": "Bad Request",
-          "message": "Attendance data with classId and (year/month or yearMonth) is required."
-       }
-
-   @apiErrorExample 오류-응답 (서버 오류):
-       HTTP/1.1 500 Internal Server Error
-       {
-          "error": "Internal Server Error",
-          "message": "..."
-       }
    \*/
    router.post('/saveAttendance', async (req, res) => {
    const attendanceData = req.body;

if (!attendanceData || !attendanceData.classId) {
return res.status(400).json({
error: 'Bad Request',
message: 'Attendance data with classId is required.',
});
}

// year와 month가 모두 없고 yearMonth도 없으면 에러
if (
!attendanceData.year &&
!attendanceData.month &&
!attendanceData.yearMonth
) {
return res.status(400).json({
error: 'Bad Request',
message:
'Attendance data with classId and (year/month or yearMonth) is required.',
});
}

const result = await saveAttendance(attendanceData);

// @ts-ignore
if (result.error) {
return res.status(500).json(result);
}

res.status(201).json(result);
});

/\*\*

-   @api {get} /api/choiMath/attendance/getStatistics 출석현황 통계 조회
-   @apiName GetAttendanceStatistics
-   @apiGroup choiMath-attendance
-
-   @apiParam {String} [classId] 클래스 ID로 검색 (선택 사항).
-   @apiParam {String} [year] 연도로 검색 (선택 사항).
-   @apiParam {String} [month] 월로 검색 (선택 사항).
-   @apiParam {String} [yearMonth] 연월로 검색 YYYYMM 형식 (선택 사항).
-   @apiParam {String} [studentId] 학생 ID로 필터링 (선택 사항, 학생별 조회 시 사용).
-
-   @apiDescription
-   출석현황 통계를 조회합니다.
-   -   status가 "none"인 경우는 통계에서 제외됩니다.
-   -   status에 "present"가 포함되면 출석으로 카운트됩니다.
-   -   status에 "absent"가 포함되면 결석으로 카운트됩니다.
-   -   status가 "late"이면 지각으로 카운트되며, lateTime 필드가 있으면 지각 시간(분)을 합산합니다.
-   -   homework는 과제 달성율입니다.
-
-   @apiSuccess {Object} summary 전체 통계 요약.
-   @apiSuccess {Number} summary.totalClasses 총 수업 수.
-   @apiSuccess {Number} summary.totalStudents 총 학생 수 (studentId 미지정 시).
-   @apiSuccess {Number} summary.totalDays 총 수업일수.
-   @apiSuccess {Number} summary.totalPresent 총 출석 횟수.
-   @apiSuccess {Number} summary.totalAbsent 총 결석 횟수.
-   @apiSuccess {Number} summary.totalLate 총 지각 횟수.
-   @apiSuccess {Number} summary.totalLateTime 총 지각 시간 (분).
-   @apiSuccess {Number} summary.averageAttendanceRate 평균 출석률 (%).
-   @apiSuccess {Number} summary.averageAbsentRate 평균 결석률 (%).
-   @apiSuccess {Number} summary.averageLateRate 평균 지각률 (%).
-   @apiSuccess {Number} summary.averageHomeworkRate 평균 과제 달성율 (%).
-   @apiSuccess {Object[]} classes 수업별 통계 (studentId 미지정 시).
-   @apiSuccess {Number} classes[].statistics.late 수업별 지각 횟수.
-   @apiSuccess {Number} classes[].statistics.lateTime 수업별 지각 시간 (분).
-   @apiSuccess {Number} classes[].statistics.attendanceRate 수업별 출석률 (%).
-   @apiSuccess {Number} classes[].statistics.absentRate 수업별 결석률 (%).
-   @apiSuccess {Number} classes[].statistics.lateRate 수업별 지각률 (%).
-   @apiSuccess {Number} classes[].students[].statistics.late 학생별 지각 횟수.
-   @apiSuccess {Number} classes[].students[].statistics.lateTime 학생별 지각 시간 (분).
-   @apiSuccess {Number} classes[].students[].statistics.attendanceRate 학생별 출석률 (%).
-   @apiSuccess {Number} classes[].students[].statistics.absentRate 학생별 결석률 (%).
-   @apiSuccess {Number} classes[].students[].statistics.lateRate 학생별 지각률 (%).
-   @apiSuccess {Object[]} student 학생별 통계 (studentId 지정 시).
-
-   @apiSuccessExample 성공-응답 (수업별):
-       HTTP/1.1 200 OK
-       {
-         "summary": {
-           "totalClasses": 1,
-           "totalStudents": 3,
-           "totalDays": 5,
-           "totalPresent": 12,
-           "totalAbsent": 3,
-           "totalLate": 2,
-           "totalLateTime": 30,
-           "averageAttendanceRate": 80.0,
-           "averageAbsentRate": 20.0,
-           "averageLateRate": 13.3,
-           "averageHomeworkRate": 100.0
-         },
-         "classes": [
-           {
-             "classId": "class-001",
-             "className": "수학1",
-             "year": "2026",
-             "month": "02",
-             "statistics": {
-               "totalStudents": 3,
-               "totalDays": 5,
-               "present": 12,
-               "absent": 3,
-               "late": 2,
-               "lateTime": 30,
-               "attendanceRate": 80.0,
-               "absentRate": 20.0,
-               "lateRate": 13.3,
-               "homeworkRate": 100.0
-             },
-             "students": [
-               {
-                 "studentId": "STU-001",
-                 "name": "학생1",
-                 "grade": "1학년",
-                 "school": "XX초등학교",
-                 "statistics": {
-                   "present": 4,
-                   "absent": 1,
-                   "late": 1,
-                   "lateTime": 15,
-                   "totalDays": 5,
-                   "attendanceRate": 80.0,
-                   "absentRate": 20.0,
-                   "lateRate": 20.0,
-                   "homeworkRate": 100.0,
-                   "homeworkCount": 5
-                 }
-               }
-             ]
-           }
-         ]
-       }
-
-   @apiSuccessExample 성공-응답 (학생별):
-       HTTP/1.1 200 OK
-       {
-         "summary": {
-           "totalClasses": 1,
-           "totalDays": 5,
-           "totalPresent": 4,
-           "totalAbsent": 1,
-           "averageAttendanceRate": 80.0,
-           "averageHomeworkRate": 100.0
-         },
-         "student": [
-           {
-             "classId": "class-001",
-             "className": "수학1",
-             "year": "2026",
-             "month": "02",
-             "studentId": "STU-001",
-             "name": "학생1",
-             "grade": "1학년",
-             "school": "XX초등학교",
-             "statistics": {
-               "present": 4,
-               "absent": 1,
-               "totalDays": 5,
-               "attendanceRate": 80.0,
-               "homeworkRate": 100.0,
-               "homeworkCount": 5
-             }
-           }
-         ]
-       }
-
-   @apiError {String} error 오류 유형.
-   @apiError {String} message 오류 설명.
    \*/
    router.get('/getStatistics', async (req, res) => {
    try {
    const result = await getAttendanceStatistics(req.query);
    // @ts-ignore
    if (result.error) {
    return res.status(500).json(result);
    }
    res.status(200).json(result);
    } catch (error) {
    res.status(500).json({ message: error.message });
    }
    });

/\*\*

-   @api {get} /api/choiMath/attendance/getStudentStatistics 학생별 출석현황 통계 조회
-   @apiName GetStudentAttendanceStatistics
-   @apiGroup choiMath-attendance
-
-   @apiParam {String} studentId 학생 ID (필수).
-   @apiParam {String} [classId] 클래스 ID (선택).
-   @apiParam {String} [year] 연도 (선택).
-   @apiParam {String} [month] 월 (선택).
-   @apiParam {String} [yearMonth] 연월로 검색 YYYYMM 형식 (선택).
-
-   @apiDescription
-   특정 학생의 출석현황 통계를 조회합니다.
-   -   studentId는 필수 파라미터입니다.
-   -   classId, year, month는 선택 파라미터로 필터링에 사용됩니다.
-   -   status가 "none"인 경우는 통계에서 제외됩니다.
-   -   status에 "present"가 포함되면 출석으로 카운트됩니다.
-   -   status에 "absent"가 포함되면 결석으로 카운트됩니다.
-   -   status가 "late"이면 지각으로 카운트되며, lateTime 필드가 있으면 지각 시간(분)을 합산합니다.
-   -   homework는 과제 달성율입니다.
-
-   @apiSuccess {Object} summary 학생 전체 통계 요약.
-   @apiSuccess {String} summary.studentId 학생 ID.
-   @apiSuccess {String} summary.studentName 학생 이름.
-   @apiSuccess {String} summary.studentGrade 학생 학년.
-   @apiSuccess {String} summary.studentSchool 학생 학교.
-   @apiSuccess {Number} summary.totalClasses 수강한 수업 수.
-   @apiSuccess {Number} summary.totalDays 총 수업일수.
-   @apiSuccess {Number} summary.totalPresent 총 출석 횟수.
-   @apiSuccess {Number} summary.totalAbsent 총 결석 횟수.
-   @apiSuccess {Number} summary.totalLate 총 지각 횟수.
-   @apiSuccess {Number} summary.totalLateTime 총 지각 시간 (분).
-   @apiSuccess {Number} summary.averageAttendanceRate 평균 출석률 (%).
-   @apiSuccess {Number} summary.averageAbsentRate 평균 결석률 (%).
-   @apiSuccess {Number} summary.averageLateRate 평균 지각률 (%).
-   @apiSuccess {Number} summary.averageHomeworkRate 평균 과제 달성율 (%).
-   @apiSuccess {Object[]} classes 수업별 상세 통계.
-   @apiSuccess {Number} classes[].statistics.late 수업별 지각 횟수.
-   @apiSuccess {Number} classes[].statistics.lateTime 수업별 지각 시간 (분).
-   @apiSuccess {Number} classes[].statistics.attendanceRate 수업별 출석률 (%).
-   @apiSuccess {Number} classes[].statistics.absentRate 수업별 결석률 (%).
-   @apiSuccess {Number} classes[].statistics.lateRate 수업별 지각률 (%).
-
-   @apiSuccessExample 성공-응답:
-       HTTP/1.1 200 OK
-       {
-         "summary": {
-           "studentId": "STU-001",
-           "studentName": "학생1",
-           "studentGrade": "1학년",
-           "studentSchool": "XX초등학교",
-           "totalClasses": 2,
-           "totalDays": 10,
-           "totalPresent": 8,
-           "totalAbsent": 2,
-           "totalLate": 3,
-           "totalLateTime": 45,
-           "averageAttendanceRate": 80.0,
-           "averageAbsentRate": 20.0,
-           "averageLateRate": 30.0,
-           "averageHomeworkRate": 95.0
-         },
-         "classes": [
-           {
-             "classId": "class-001",
-             "className": "수학1",
-             "year": "2026",
-             "month": "02",
-             "statistics": {
-               "totalDays": 5,
-               "present": 4,
-               "absent": 1,
-               "late": 2,
-               "lateTime": 30,
-               "attendanceRate": 80.0,
-               "absentRate": 20.0,
-               "lateRate": 40.0,
-               "homeworkRate": 100.0,
-               "homeworkCount": 5
-             }
-           }
-         ]
-       }
-
-   @apiError {String} error 오류 유형.
-   @apiError {String} message 오류 설명.
-
-   @apiErrorExample 오류-응답 (studentId 누락):
-       HTTP/1.1 400 Bad Request
-       {
-         "error": "Bad Request",
-         "message": "studentId is required"
-       }
    \*/
    router.get('/getStudentStatistics', async (req, res) => {
    try {
    // @ts-ignore
    const result = await getStudentAttendanceStatistics(req.query);
    // @ts-ignore
    if (result.error) {
    const statusCode = result.error === 'Bad Request' ? 400 : 500;
    return res.status(statusCode).json(result);
    }
    res.status(200).json(result);
    } catch (error) {
    res.status(500).json({ message: error.message });
    }
    });

module.exports = router;
