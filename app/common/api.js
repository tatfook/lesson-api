'use strict';

const _ = require('lodash');
const axios = require('axios');
const pathToRegexp = require('path-to-regexp');
const helper = require('../extend/helper');

class Api {
    constructor(config, app) {
        this.config = config;
        this.app = app;
    }

    curlConfig(token, baseURL) {
        return {
            headers: {
                Authorization: 'Bearer ' + token,
            },
            baseURL,
        };
    }

    async curl(method, url, data, config = {}) {
        if (this.app.config.env === 'unittest') return;
        url = config.baseURL + pathToRegexp.compile(url)(data || {});
        method = (method || 'get').toLowerCase();
        config = { ...config, method, url };
        if (
            method === 'get' ||
            method === 'delete' ||
            method === 'head' ||
            method === 'options'
        ) {
            config.params = data;
        } else {
            config.data = data;
        }

        return axios
            .request(config)
            .then(res => {
                this.app.logger.debug(
                    `请求:${url}成功`,
                    JSON.stringify(res.config)
                );
                return res.data;
            })
            .catch(res => {
                this.app.logger.debug(
                    `请求:${url}失败`,
                    res.responsestatus,
                    res.response.data
                );
            });
    }

    get gitConfig() {
        return this.curlConfig(this.config.adminToken, this.config.gitBaseURL);
    }

    get esConfig() {
        return this.curlConfig(this.config.adminToken, this.config.esBaseURL);
    }

    async createGitUser(data) {
        return await this.curl('post', '/accounts', data, this.gitConfig);
    }

    async createGitProject(data) {
        return await this.curl(
            'post',
            '/projects/user/:username',
            data,
            this.gitConfig
        );
    }

    async deleteGitProject(data) {
        const url =
            '/projects/' +
            encodeURIComponent(data.username + '/' + data.sitename);
        return await this.curl('delete', url, {}, this.gitConfig);
    }

    async setGitProjectVisibility(data) {
        const url =
            '/projects/' +
            encodeURIComponent(data.username + '/' + data.sitename) +
            '/visibility';

        return await this.curl('put', url, data, this.gitConfig);
    }

    async usersUpsert(inst) {
        return this.curl(
            'post',
            `/users/${inst.id}/upsert`,
            {
                // return await this.curl('post', `/users/${inst.id}/upsert`, {
                id: inst.id,
                username: inst.username,
                user_portrait: inst.portrait,
            },
            this.esConfig
        );
    }

    async sitesUpsert(inst) {
        return this.curl(
            'post',
            `/sites/${inst.id}/upsert`,
            {
                // return await this.curl('post', `/sites/${inst.id}/upsert`, {
                id: inst.id,
                username: inst.username,
                sitename: inst.sitename,
                display_name: inst.displayName,
                cover: inst.extra.imageUrl,
                desc: inst.description,
            },
            this.esConfig
        );
    }

    async projectsUpsert(inst) {
        const user = await this.app.model.User.findOne({
            where: { id: inst.userId },
        });
        if (!user) return;

        return this.curl(
            'post',
            `/projects/${inst.id}/upsert`,
            {
                // return await this.curl('post', `/projects/${inst.id}/upsert`, {
                id: inst.id,
                name: inst.name,
                username: user.username,
                user_portrait: user.portrait,
                visibility: inst.visibility === 0 ? 'public' : 'private',
                recruiting: !!(inst.privilege & 1),
                type: inst.type === 0 ? 'paracraft' : 'site',
                created_time: inst.createdAt,
                cover: inst.extra.imageUrl,
                total_like: inst.star,
                total_view: inst.visit,
                total_mark: inst.favorite,
                recent_like: inst.lastStar,
                recent_view: inst.lastVisit,
                updated_time: inst.updatedAt,
            },
            this.esConfig
        );
    }

    async packagesUpsert(inst) {
        _.each(inst, (val, key) => {
            if (val == null) delete inst[key];
        });
        const two = 2;
        if (inst.state === two) {
            const totalLessons = await this.app.model.PackageLesson.count({
                where: { packageId: inst.id },
            });
            return this.curl(
                'post',
                `/packages/${inst.id}/upsert`,
                {
                    // return await this.curl('post', `/projects/${inst.id}/upsert`, {
                    id: inst.id,
                    title: inst.packageName,
                    total_lessons: totalLessons,
                    description: inst.description,
                    age_min: inst.minAge,
                    age_max: inst.maxAge,
                    cover: inst.coverUrl,
                    created_at: inst.createdAt,
                    updated_at: inst.updatedAt,
                    recent_view: inst.lastClassroomCount,
                },
                this.esConfig
            );
        }
        this.packagesDestroy(inst);
    }

    async usersDestroy({ id }) {
        return await this.curl('delete', `/users/${id}`, {}, this.esConfig);
    }

    async sitesDestroy({ id }) {
        return await this.curl('delete', `/sites/${id}`, {}, this.esConfig);
    }

    async projectsDestroy({ id }) {
        return await this.curl('delete', `/projects/${id}`, {}, this.esConfig);
    }

    async packagesDestroy({ id }) {
        return await this.curl('delete', `/packages/${id}`, {}, this.esConfig);
    }
}

module.exports = app => {
    const config = app.config.self;

    const AN_HOUR_SECONDS = 3600; // 一小时的秒
    const A_DAY_HOURS = 24; // 一天的小时
    const A_YEAR_DAYS = 365; // 一年的天
    const TEN = 10; //

    config.adminToken = helper.jwtEncode(
        { userId: 1, username: 'xiaoyao', roleId: 10 },
        config.secret,
        AN_HOUR_SECONDS * A_DAY_HOURS * A_YEAR_DAYS * TEN
    );
    app.api = new Api(config, app);
};
