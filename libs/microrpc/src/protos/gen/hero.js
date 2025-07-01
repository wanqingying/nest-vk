/*eslint-disable block-scoped-var, id-length, no-control-regex, no-magic-numbers, no-prototype-builtins, no-redeclare, no-shadow, no-var, sort-vars*/
"use strict";

var $protobuf = require("protobufjs/minimal");

// Common aliases
var $util = $protobuf.util;

// Exported root namespace
var $root = $protobuf.roots["default"] || ($protobuf.roots["default"] = {});

$root.hero = (function() {

    /**
     * Namespace hero.
     * @exports hero
     * @namespace
     */
    var hero = {};

    hero.HeroesService = (function() {

        /**
         * Constructs a new HeroesService service.
         * @memberof hero
         * @classdesc Represents a HeroesService
         * @extends $protobuf.rpc.Service
         * @constructor
         * @param {$protobuf.RPCImpl} rpcImpl RPC implementation
         * @param {boolean} [requestDelimited=false] Whether requests are length-delimited
         * @param {boolean} [responseDelimited=false] Whether responses are length-delimited
         */
        function HeroesService(rpcImpl, requestDelimited, responseDelimited) {
            $protobuf.rpc.Service.call(this, rpcImpl, requestDelimited, responseDelimited);
        }

        (HeroesService.prototype = Object.create($protobuf.rpc.Service.prototype)).constructor = HeroesService;

        /**
         * Creates new HeroesService service using the specified rpc implementation.
         * @function create
         * @memberof hero.HeroesService
         * @static
         * @param {$protobuf.RPCImpl} rpcImpl RPC implementation
         * @param {boolean} [requestDelimited=false] Whether requests are length-delimited
         * @param {boolean} [responseDelimited=false] Whether responses are length-delimited
         * @returns {HeroesService} RPC service. Useful where requests and/or responses are streamed.
         */
        HeroesService.create = function create(rpcImpl, requestDelimited, responseDelimited) {
            return new this(rpcImpl, requestDelimited, responseDelimited);
        };

        /**
         * Callback as used by {@link hero.HeroesService#findOne}.
         * @memberof hero.HeroesService
         * @typedef FindOneCallback
         * @type {function}
         * @param {Error|null} error Error, if any
         * @param {hero.Hero} [response] Hero
         */

        /**
         * Calls FindOne.
         * @function findOne
         * @memberof hero.HeroesService
         * @instance
         * @param {hero.IHeroById} request HeroById message or plain object
         * @param {hero.HeroesService.FindOneCallback} callback Node-style callback called with the error, if any, and Hero
         * @returns {undefined}
         * @variation 1
         */
        Object.defineProperty(HeroesService.prototype.findOne = function findOne(request, callback) {
            return this.rpcCall(findOne, $root.hero.HeroById, $root.hero.Hero, request, callback);
        }, "name", { value: "FindOne" });

        /**
         * Calls FindOne.
         * @function findOne
         * @memberof hero.HeroesService
         * @instance
         * @param {hero.IHeroById} request HeroById message or plain object
         * @returns {Promise<hero.Hero>} Promise
         * @variation 2
         */

        /**
         * Callback as used by {@link hero.HeroesService#updateHero}.
         * @memberof hero.HeroesService
         * @typedef UpdateHeroCallback
         * @type {function}
         * @param {Error|null} error Error, if any
         * @param {hero.Hero} [response] Hero
         */

        /**
         * Calls UpdateHero.
         * @function updateHero
         * @memberof hero.HeroesService
         * @instance
         * @param {hero.IHero} request Hero message or plain object
         * @param {hero.HeroesService.UpdateHeroCallback} callback Node-style callback called with the error, if any, and Hero
         * @returns {undefined}
         * @variation 1
         */
        Object.defineProperty(HeroesService.prototype.updateHero = function updateHero(request, callback) {
            return this.rpcCall(updateHero, $root.hero.Hero, $root.hero.Hero, request, callback);
        }, "name", { value: "UpdateHero" });

        /**
         * Calls UpdateHero.
         * @function updateHero
         * @memberof hero.HeroesService
         * @instance
         * @param {hero.IHero} request Hero message or plain object
         * @returns {Promise<hero.Hero>} Promise
         * @variation 2
         */

        return HeroesService;
    })();

    hero.HeroById = (function() {

        /**
         * Properties of a HeroById.
         * @memberof hero
         * @interface IHeroById
         * @property {number|null} [id] HeroById id
         */

        /**
         * Constructs a new HeroById.
         * @memberof hero
         * @classdesc Represents a HeroById.
         * @implements IHeroById
         * @constructor
         * @param {hero.IHeroById=} [properties] Properties to set
         */
        function HeroById(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * HeroById id.
         * @member {number} id
         * @memberof hero.HeroById
         * @instance
         */
        HeroById.prototype.id = 0;

        /**
         * Creates a new HeroById instance using the specified properties.
         * @function create
         * @memberof hero.HeroById
         * @static
         * @param {hero.IHeroById=} [properties] Properties to set
         * @returns {hero.HeroById} HeroById instance
         */
        HeroById.create = function create(properties) {
            return new HeroById(properties);
        };

        /**
         * Verifies a HeroById message.
         * @function verify
         * @memberof hero.HeroById
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        HeroById.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.id != null && message.hasOwnProperty("id"))
                if (!$util.isInteger(message.id))
                    return "id: integer expected";
            return null;
        };

        /**
         * Creates a HeroById message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof hero.HeroById
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {hero.HeroById} HeroById
         */
        HeroById.fromObject = function fromObject(object) {
            if (object instanceof $root.hero.HeroById)
                return object;
            var message = new $root.hero.HeroById();
            if (object.id != null)
                message.id = object.id | 0;
            return message;
        };

        /**
         * Creates a plain object from a HeroById message. Also converts values to other types if specified.
         * @function toObject
         * @memberof hero.HeroById
         * @static
         * @param {hero.HeroById} message HeroById
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        HeroById.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.defaults)
                object.id = 0;
            if (message.id != null && message.hasOwnProperty("id"))
                object.id = message.id;
            return object;
        };

        /**
         * Converts this HeroById to JSON.
         * @function toJSON
         * @memberof hero.HeroById
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        HeroById.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for HeroById
         * @function getTypeUrl
         * @memberof hero.HeroById
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        HeroById.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/hero.HeroById";
        };

        return HeroById;
    })();

    hero.Hero = (function() {

        /**
         * Properties of a Hero.
         * @memberof hero
         * @interface IHero
         * @property {number|null} [id] Hero id
         * @property {string|null} [name] Hero name
         */

        /**
         * Constructs a new Hero.
         * @memberof hero
         * @classdesc Represents a Hero.
         * @implements IHero
         * @constructor
         * @param {hero.IHero=} [properties] Properties to set
         */
        function Hero(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * Hero id.
         * @member {number} id
         * @memberof hero.Hero
         * @instance
         */
        Hero.prototype.id = 0;

        /**
         * Hero name.
         * @member {string} name
         * @memberof hero.Hero
         * @instance
         */
        Hero.prototype.name = "";

        /**
         * Creates a new Hero instance using the specified properties.
         * @function create
         * @memberof hero.Hero
         * @static
         * @param {hero.IHero=} [properties] Properties to set
         * @returns {hero.Hero} Hero instance
         */
        Hero.create = function create(properties) {
            return new Hero(properties);
        };

        /**
         * Verifies a Hero message.
         * @function verify
         * @memberof hero.Hero
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        Hero.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.id != null && message.hasOwnProperty("id"))
                if (!$util.isInteger(message.id))
                    return "id: integer expected";
            if (message.name != null && message.hasOwnProperty("name"))
                if (!$util.isString(message.name))
                    return "name: string expected";
            return null;
        };

        /**
         * Creates a Hero message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof hero.Hero
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {hero.Hero} Hero
         */
        Hero.fromObject = function fromObject(object) {
            if (object instanceof $root.hero.Hero)
                return object;
            var message = new $root.hero.Hero();
            if (object.id != null)
                message.id = object.id | 0;
            if (object.name != null)
                message.name = String(object.name);
            return message;
        };

        /**
         * Creates a plain object from a Hero message. Also converts values to other types if specified.
         * @function toObject
         * @memberof hero.Hero
         * @static
         * @param {hero.Hero} message Hero
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        Hero.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.defaults) {
                object.id = 0;
                object.name = "";
            }
            if (message.id != null && message.hasOwnProperty("id"))
                object.id = message.id;
            if (message.name != null && message.hasOwnProperty("name"))
                object.name = message.name;
            return object;
        };

        /**
         * Converts this Hero to JSON.
         * @function toJSON
         * @memberof hero.Hero
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        Hero.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for Hero
         * @function getTypeUrl
         * @memberof hero.Hero
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        Hero.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/hero.Hero";
        };

        return Hero;
    })();

    return hero;
})();

module.exports = $root;
