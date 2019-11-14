'use strict';

const Service = require('../common/service.js');

class LessonContentService extends Service {
    /**
     * 发布课程
     * @param {*} userId userId
     * @param {*} lessonId 课程ID
     * @param {*} content 教案内容
     * @param {*} courseware 课件内容
     */
    async releaseLesson(userId, lessonId, content, courseware) {
        return await this.ctx.model.LessonContent.release(
            userId,
            lessonId,
            content,
            courseware
        );
    }

    /**
     * 获取某个版本的教案内容
     * @param {*} lessonId lessonId
     * @param {*} version version
     */
    async getLessonContent(lessonId, version) {
        return await this.ctx.model.LessonContent.content(lessonId, version);
    }
}

module.exports = LessonContentService;
