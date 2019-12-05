// const md5 = require("blueimp-md5");
const { app, assert } = require('egg-mock/bootstrap');

describe('机构表单', () => {
    let token;
    let organ;
    beforeEach(async () => {
        const user = await app.login({ roleId: 64 });
        token = user.token;

        // 创建机构
        organ = await app.model.LessonOrganization.create({
            name: 'org0000',
            count: 1,
            endDate: new Date('2200-01-01'),
        }).then(o => o.toJSON());
        // 创建管理员
        await app.model.LessonOrganizationClassMember.create({
            organizationId: organ.id,
            memberId: 1,
            roleId: 64,
            classId: 0,
        });
    });

    describe('创建表单', async () => {
        it('001', async () => {
            const form = await app
                .httpRequest()
                .post('/lessonOrganizationForms')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    organizationId: organ.id,
                    type: 3,
                    title: '测试',
                    description: '报名表单',
                    quizzes: [
                        {
                            title: '这是一个问答题?',
                        },
                    ],
                })
                .expect(200)
                .then(res => res.body);
        });
    });

    describe('修改表单', async () => {
        let form;
        beforeEach(async () => {
            form = await app.model.LessonOrganizationForm.create({
                organizationId: organ.id,
                type: 3,
                title: '测试',
                description: '报名表单',
                quizzes: [
                    {
                        title: '这是一个问答题?',
                    },
                ],
            });
        });
        it('001', async () => {
            await app
                .httpRequest()
                .put('/lessonOrganizationForms/' + form.id)
                .set('Authorization', `Bearer ${token}`)
                .send({
                    state: 1,
                    title: '修改',
                })
                .expect(200)
                .then(res => res.body);

            const f = await app.model.LessonOrganizationForm.findOne({
                where: { id: form.id },
            });
            assert(f.state === 1 && f.title === '修改');
        });
    });

    describe('提交表单', async () => {
        let form;
        beforeEach(async () => {
            form = await app.model.LessonOrganizationForm.create({
                organizationId: organ.id,
                type: 3,
                title: '测试',
                description: '报名表单',
                quizzes: [
                    {
                        title: '这是一个问答题?',
                    },
                ],
            });
        });
        it('001', async () => {
            const submit = await app
                .httpRequest()
                .post(`/lessonOrganizationForms/${form.id}/submit`)
                .send({
                    quizzes: [
                        {
                            title: '这是一个问答题?',
                        },
                    ],
                })
                .expect(200)
                .then(res => res.body);
            assert(submit);
        });
    });

    describe('获取提交列表', async () => {
        let form;
        beforeEach(async () => {
            form = await app.model.LessonOrganizationForm.create({
                organizationId: organ.id,
                type: 3,
                title: '测试',
                description: '报名表单',
                quizzes: [
                    {
                        title: '这是一个问答题?',
                    },
                ],
            });

            await app.model.LessonOrganizationFormSubmit.create({
                organizationId: organ.id,
                formId: form.id,
                userId: 1,
            });
        });
        it('001', async () => {
            const submits = await app
                .httpRequest()
                .get(
                    `/lessonOrganizationForms/${form.id}/submit?organizationId=${organ.id}`
                )
                .set('Authorization', `Bearer ${token}`)
                .expect(res => assert(res.statusCode === 200))
                .then(res => res.body.data);
            assert(submits.count === 1);
        });
    });

    describe('更改提交', async () => {
        let form;
        let submit;
        beforeEach(async () => {
            form = await app.model.LessonOrganizationForm.create({
                organizationId: organ.id,
                type: 3,
                title: '测试',
                description: '报名表单',
                quizzes: [
                    {
                        title: '这是一个问答题?',
                    },
                ],
            });

            submit = await app.model.LessonOrganizationFormSubmit.create({
                organizationId: organ.id,
                formId: form.id,
                userId: 1,
            });
        });
        it('001', async () => {
            await app
                .httpRequest()
                .put(`/lessonOrganizationForms/${form.id}/submit/${submit.id}`)
                .set('Authorization', `Bearer ${token}`)
                .send({
                    comment: '修改',
                })
                .expect(200)
                .then(res => res.body);

            const sub = await app.model.LessonOrganizationFormSubmit.findOne({
                where: { id: submit.id },
            });
            assert(sub.comment === '修改');
        });
    });

    describe('删除提交', async () => {
        let form;
        let submit;
        beforeEach(async () => {
            form = await app.model.LessonOrganizationForm.create({
                organizationId: organ.id,
                type: 3,
                title: '测试',
                description: '报名表单',
                quizzes: [
                    {
                        title: '这是一个问答题?',
                    },
                ],
            });

            submit = await app.model.LessonOrganizationFormSubmit.create({
                organizationId: organ.id,
                formId: form.id,
                userId: 1,
            });
        });
        it('001', async () => {
            await app
                .httpRequest()
                .delete(`/lessonOrganizationForms/${submit.id}`)
                .set('Authorization', `Bearer ${token}`)
                .send({
                    comment: '修改',
                })
                .expect(200)
                .then(res => res.body);

            const sub = await app.model.LessonOrganizationForm.findOne({
                where: { id: submit.id },
            });
            assert(!sub);
        });
        it('002 普通人只能删除自己的', async () => {
            const user = await app.login({ roleId: 1 });
            const token = user.token;

            await app
                .httpRequest()
                .delete(`/lessonOrganizationForms/${submit.id}`)
                .set('Authorization', `Bearer ${token}`)
                .send({
                    comment: '修改',
                })
                .expect(200)
                .then(res => res.body);

            const sub = await app.model.LessonOrganizationForm.findOne({
                where: { id: submit.id },
            });
            assert(sub);
        });
    });

    describe('检索全部表单', async () => {
        beforeEach(async () => {
            await app.model.LessonOrganizationForm.create({
                organizationId: organ.id,
                type: 3,
                title: '测试',
                description: '报名表单',
                quizzes: [
                    {
                        title: '这是一个问答题?',
                    },
                ],
            });
        });
        it('001', async () => {
            const forms = await app
                .httpRequest()
                .post(`/lessonOrganizationForms/search`)
                .send({ organizationId: organ.id })
                .expect(200)
                .then(res => res.body.data);
            assert(forms.length === 1);
        });
    });
});
