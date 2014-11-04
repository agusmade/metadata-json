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

define(function (require, exports, module) {
    "use strict";

    var _global    = require("core/Global").global;

    /**
     * Error Messages
     */
    var ERR_METATYPE_OBJECT      = '"<%=name%>" should be an object',
        ERR_FIELD_TYPE           = '"<%=metaType.name%>.<%=field%>" should be "<%=type%>" type',
        ERR_REQUIRE_FIELD        = '"<%=metaType.name%>" requires field "<%=field%>"',
        ERR_METATYPE_KIND        = '"<%=metaType.name%>.kind" should be "enum" or "class"',
        ERR_DUPLICATED_LITERAL   = '"<%=metaType.name%>" has duplicated literal "<%=literal%>"',
        ERR_ENUM_HAS_LITERALS    = '"<%=metaType.name%>" should have at least one or more literals',
        ERR_TYPE_NOT_FOUND       = '"<%=type%>" is not found specified in "<%=metaType.name%>.<%=field%>"',
        ERR_UNNAMED_ATTRIBUTE    = '"<%=metaType.name%>" has unnamed attribute',
        ERR_DUPLICATED_ATTRIBUTE = '"<%=metaType.name%>" has duplicated attribute "<%=attribute.name%>"',
        ERR_ATTRIBUTE_KIND       = '"<%=metaType.name%>.<%=attribute.name%>.kind" should be "prim", "enum", "var", "ref", "refs", "obj", "objs", or "custom"',
        ERR_ATTRIBUTE_PRIM_TYPE  = '"<%=metaType.name%>.<%=attribute.name%>.type" should be "Integer", "String", "Boolean", or "Real"';

    /**
     * Assertion
     * @param {boolean} condition
     * @param {string} message
     */
    function assert(condition, message, strings) {
        if (!condition) {
            var err = _.template(message, strings);
            throw "[MetaModelManager] " + err;
        }
    }

    /**
     * Validate MetaType Definition
     * @param {Object} metaType
     */
    function validateMetaType(name, metaType) {
        assert(_.isObject(metaType), ERR_METATYPE_OBJECT, { name: name });
        assert(metaType.name, ERR_REQUIRE_FIELD, { metaType: metaType, field: "name" });
        assert(metaType.kind === "enum" || metaType.kind === "class", ERR_METATYPE_KIND, { metaType: metaType });

        // Enum MetaType
        if (metaType.kind === "enum") {
            var lits = metaType.literals;
            assert(Array.isArray(lits) && lits.length > 0, ERR_ENUM_HAS_LITERALS, { metaType: metaType });

            // Check duplicated literal
            _.each(lits, function (lit1) {
                var len = _.filter(lits, function (lit2) { return lit2 === lit1; }).length;
                assert(len === 1, ERR_DUPLICATED_LITERAL, { metaType: metaType, literal: lit1 });
            });
        }

        // Class MetaType
        if (metaType.kind === "class") {

            // Check .super
            if (metaType.super) {
                assert(metaType.super && _global.meta[metaType.super], ERR_TYPE_NOT_FOUND, { metaType: metaType, type: metaType.super, field: "super" });
            }

            // Check Attributes
            if (metaType.attributes) {
                assert(Array.isArray(metaType.attributes), ERR_FIELD_TYPE, { metaType: metaType, field: "attributes", type: "Array" });
                _.each(metaType.attributes, function (attribute) {

                    // check 'name'
                    assert(attribute.name, ERR_UNNAMED_ATTRIBUTE, { metaType: metaType });

                    // Check 'kind'
                    assert(_.contains(["prim", "enum", "var", "ref", "refs", "obj", "objs", "custom"], attribute.kind), ERR_ATTRIBUTE_KIND, { metaType: metaType, attribute: attribute });

                    // Check 'type'
                    if (attribute.kind === "prim") {
                        assert(_.contains(["Integer", "String", "Boolean", "Real"], attribute.type), ERR_ATTRIBUTE_PRIM_TYPE, { metaType: metaType, attribute: attribute });
                    } else if (attribute.kind !== "custom") {
                        assert(_global.meta[attribute.type], ERR_TYPE_NOT_FOUND, { metaType: metaType, type: attribute.type, field: attribute.name + ".type" });
                    }

                    // Check duplicated attribute in all inherited attributes
                    var len = _.filter(getMetaAttributes(metaType.name), function (attr) { return attr.name === attribute.name; }).length;
                    assert(len === 1, ERR_DUPLICATED_ATTRIBUTE, { metaType: metaType, attribute: attribute });
                });
            }
        }
    }

    /**
     * Register Metamodel by Object
     * @param {Object} metamodel
     */
    function register(metamodel) {
        var name, metaType;

        // Registering MetaTypes to global.meta
        for (name in metamodel) {
            if (metamodel.hasOwnProperty(name)) {
                metaType = metamodel[name];
                metaType.name = name;

                // Check duplicated MetaType
                if (_global.meta[name]) {
                    delete metamodel[name];
                    console.error("[MetaModelManager] MetaType '" + name + "' is already exists.");
                } else {
                    _global.meta[name] = metaType;
                }
            }
        }

        // Validate MetaTypes
        for (name in metamodel) {
            if (metamodel.hasOwnProperty(name)) {
                metaType = metamodel[name];
                try {
                    validateMetaType(name, metaType);
                } catch (err) {
                    console.error(err);
                }
            }
        }
    }

    /**
     * Return all meta-attributes
     * @param {string} typeName
     * @return {Array.<{name:string, kind:string, type:string}>}
     */
    function getMetaAttributes(typeName) {
        var metaClass = _global.meta[typeName],
            attrs     = [];
        if (metaClass.super) {
            attrs = getMetaAttributes(metaClass.super);
        }
        if (metaClass.attributes) {
            var i, len, item;
            for (i = 0, len = metaClass.attributes.length; i < len; i++) {
                item = metaClass.attributes[i];
                attrs.push(item);
            }
        }
        return attrs;
    }

    /**
     * Type test: is-kind-of
     * @param {string} child
     * @param {string} parent
     * @return {boolean}
     */
    function isKindOf(child, parent) {
        if (!_global.meta[child]) {
            return false;
        } else if (_global.meta[child] === _global.meta[parent]) {
            return true;
        } else {
            return isKindOf(_global.meta[child].super, parent);
        }
    }

    exports.register          = register;
    exports.getMetaAttributes = getMetaAttributes;
    exports.isKindOf          = isKindOf;

});
