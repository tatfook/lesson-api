
const email = require("./app/core/email.js");
const util = require("./app/core/util.js");
const model = require("./app/core/model.js");
const api = require("./app/core/api.js");
const association = require("./app/core/association.js");

module.exports = async (app) => {
	app.util = util;

	email(app);
	model(app);
	api(app);

	association(app); // 定义模型关系

	// console.log("--------构建表-------");
	// app.model.Classrooms.sync({force:true});
	// app.model.Coins.sync({force:true});
	// app.model.LearnRecords.sync({force:true});
	// app.model.LessonContents.sync({force:true});
	// app.model.LessonRewards.sync({force:true});
	// app.model.Lessons.sync({force:true});
	// app.model.LessonSkills.sync({force:true});
	// app.model.Logs.sync({force:true});
	// app.model.PackageLessons.sync({force:true});
	// app.model.Packages.sync({force:true});
	// app.model.PackageSorts.sync({force:true});
	// app.model.Skills.sync({force:true});
	// app.model.Subjects.sync({force:true});
	// app.model.Subscribes.sync({force:true});
	// app.model.TeacherCDKeys.sync({force:true});
	// app.model.Teachers.sync({force:true});
	// app.model.UserLearnRecords.sync({force:true});
	// app.model.Users.sync({force:true});
	
	// app.model.tutors.sync({force:true});
};


