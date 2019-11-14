
2019.11.06
现存extra的表列表如下：

### classrooms （老师开启课程的记录，没有在用）
- coverUrl
- lessonNo
- lessonName 
- lessonGoals
- packageName

### learnRecords （没有用了）
- name
- quiz
- portrait
- username
- howManyDays

### lessonOrganizationActivateCodes
- name（实际场景没有用）

### lessonOrganizations
- visitedList(没有了)
- admissionMsg(没有了)

### lessons
- coverUrl
- duration
- teacherVideoUrl
- videoUrl

### packageLessons
- lessonNo
 
### packages
- coverUrl

### subscribes （没有了）
- learnedLessons
- teachedLessons

### userLearnRecords （没有这个了）
- name
- quiz
	- key
	- data
		- id
		- desc
		- type
		- score
		- title
		- answer
		- options
			- item
	- answer
	- result

### users 
- learn (没在用)
	- lastLearnDate
	- learnDayCount
- classroomId（没在用）

---

综上，所以以下是要处理的

### lessons
- coverUrl
- duration
- teacherVideoUrl
- videoUrl

### packageLessons
- lessonNo
 
### packages
- coverUrl

### lessonOrganizationActivateCodes
- name
