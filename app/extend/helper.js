'use strict';

const _ = require('lodash');
const jwt = require('../common/jwt');
const crypto = require('crypto');
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
    getDate: () => {
        const two = 2;
        const four = 4;

        const date = new Date();
        const year = _.padStart(date.getFullYear(), four, '0');
        const month = _.padStart(date.getMonth() + 1, two, '0');
        const day = _.padStart(date.getDate(), two, '0');
        const hour = _.padStart(date.getHours(), two, '0');
        const minute = _.padStart(date.getMinutes(), two, '0');
        const second = _.padStart(date.getSeconds(), two, '0');

        const datetime = year + month + day + hour + minute + second;
        const datestr = year + month + day;
        const timestr = hour + minute + second;
        return {
            year,
            month,
            day,
            hour,
            minute,
            second,
            datetime,
            datestr,
            timestr,
        };
    },
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
    rsaEncrypt: (prvKey, message) => {
        return crypto
            .privateEncrypt(prvKey, Buffer.from(message, 'utf8'))
            .toString('hex');
    },
    rsaDecrypt: (pubKey, sig) => {
        return crypto
            .publicDecrypt(pubKey, Buffer.from(sig, 'hex'))
            .toString('utf8');
    },
    md5: str => {
        return md5(str);
    },
    objToQueryStr: obj => {
        return Object.keys(obj)
            .map(function(key) {
                return ''
                    .concat(encodeURIComponent(key), '=')
                    .concat(encodeURIComponent(obj[key]));
            })
            .join('&');
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
                // eslint-disable-next-line no-console
                console.log(res);
                this.app.logger.debug(
                    `请求:${url}失败`,
                    res.responsestatus,
                    res.response.data
                );
            });
    },
};
