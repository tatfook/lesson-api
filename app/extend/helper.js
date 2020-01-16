'use strict';

const jwt = require('../common/jwt');
const md5 = require('blueimp-md5');
const axios = require('axios');

const AN_HOUR_SECONDS = 3600; // 一小时的秒
const THOUSAND = 1000;
const A_DAY_HOURS = 24; // 一天的小时
const HUNDRED = 100;

module.exports = {
    success: ({ ctx, status = 200, res = null }) => {
        ctx.status = status;
        ctx.body = {
            message: '请求成功',
            data: res,
        };
    },
    fail: ({ ctx, status = 500, errMsg }) => {
        ctx.status = status;
        ctx.body = {
            message: errMsg,
            data: {},
        };
    },
    // ----以下是工具函数-----
    jwtEncode: (
        payload,
        key,
        expire = AN_HOUR_SECONDS * A_DAY_HOURS * HUNDRED
    ) => {
        payload = payload || {};
        payload.exp = Date.now() / THOUSAND + expire;

        return jwt.encode(payload, key, 'HS1');
    },
    jwtDecode: (token, key, noVerify) => {
        return jwt.decode(token, key, noVerify, 'HS1');
    },
    md5: str => {
        return md5(str);
    },
    async curl(method, url, data, config = {}, forceData = false) {
        method = (method || 'get').toLowerCase();
        config = { ...config, method, url };
        if (
            [ 'get', 'delete', 'head', 'options' ].includes(method) &&
            !forceData
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
    },
};
