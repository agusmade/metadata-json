/*
 * Copyright (c) 2013-2014 Minkyu Lee. All rights reserved.
 *
 * NOTICE:  All information contained herein is, and remains the
 * property of Minkyu Lee. The intellectual and technical concepts
 * contained herein are proprietary to Minkyu Lee and may be covered
 * by Republic of Korea and Foreign Patents, patents in process,
 * and are protected by trade secret or copyright law.
 * Dissemination of this information or reproduction of this material
 * is strictly forbidden unless prior written permission is obtained
 * from Minkyu Lee (niklaus.lee@gmail.com).
 *
 */

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, regexp: true */
/*global define, _*/

var fs         = require("fs"),
    ejs        = require("ejs"),
    markdown   = require("markdown").markdown,
    escapeHtml = require("escape-html");

/**
 * Render a template file with data and save to a file
 * @param{string} templatePath
 * @param{Object} data
 */
function render(templatePath, resultPath, data) {
    var template = fs.readFileSync(templatePath, 'utf8');
    data.filename = __dirname + "/../" + templatePath; // to avoid "include" error
    var str = ejs.render(template, data);
    fs.writeFileSync(resultPath, str);
}


// Filters

ejs.filters.toUrl = function (elem) {
    var fn = elem.getPathname().replace(/[\/\*<>:\\\"|?]/g, "_");
    return fn + ".html";
};

ejs.filters.toText = function (elem) {
    return elem.getNodeText();
};

ejs.filters.toName = function (elem) {
    if (elem.name.trim().length === 0) {
        return "(unnamed)";
    }
    return elem.name;
};

ejs.filters.toIcon = function (elem) {
    return "_" + elem.getNodeIcon();
};

ejs.filters.toType = function (obj) {
    if (typeof obj === "undefined" || obj === null || (typeof obj === "string" && obj.trim().length === 0)) {
        return "<span class='label label-info'>none</span>";
    } else if (obj instanceof type.Model) {
        return "<a href='" + ejs.filters.toUrl(obj) + "'>" + escapeHtml(obj.name) + "</a>";
    }
    return escapeHtml(obj);
};

ejs.filters.toValue = function (obj) {
    if (typeof obj === "undefined") {
        return "<span class='label label-info'>void</span>";
    } else if (obj === null) {
        return "<span class='label label-info'>null</span>";
    } else if (typeof obj === "boolean") {
        return "<span class='label label-info'>" + obj + "</span>";
    } else if (typeof obj === "number") {
        return "<span class='label label-info'>" + obj + "</span>";
    } else if (typeof obj === "string") {
        return escapeHtml(obj);
    } else if (obj instanceof type.UMLStereotype) {
        return "<a href='" + ejs.filters.toUrl(obj) + "'>«" + escapeHtml(obj.name) + "»</a>";
    } else if (obj instanceof type.Model) {
        return "<a href='" + ejs.filters.toUrl(obj) + "'>" + escapeHtml(obj.name) + "</a>";
    }
    return escapeHtml(obj);
};

ejs.filters.markdown = function (text) {
    return markdown.toHTML(text);
};

exports.render = render;