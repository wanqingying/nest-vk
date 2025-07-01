import * as $protobuf from "protobufjs";
import Long = require("long");
/** Namespace hero. */
export namespace hero {

    /** Represents a HeroesService */
    class HeroesService extends $protobuf.rpc.Service {

        /**
         * Constructs a new HeroesService service.
         * @param rpcImpl RPC implementation
         * @param [requestDelimited=false] Whether requests are length-delimited
         * @param [responseDelimited=false] Whether responses are length-delimited
         */
        constructor(rpcImpl: $protobuf.RPCImpl, requestDelimited?: boolean, responseDelimited?: boolean);

        /**
         * Creates new HeroesService service using the specified rpc implementation.
         * @param rpcImpl RPC implementation
         * @param [requestDelimited=false] Whether requests are length-delimited
         * @param [responseDelimited=false] Whether responses are length-delimited
         * @returns RPC service. Useful where requests and/or responses are streamed.
         */
        public static create(rpcImpl: $protobuf.RPCImpl, requestDelimited?: boolean, responseDelimited?: boolean): HeroesService;

        /**
         * Calls FindOne.
         * @param request HeroById message or plain object
         * @param callback Node-style callback called with the error, if any, and Hero
         */
        public findOne(request: hero.IHeroById, callback: hero.HeroesService.FindOneCallback): void;

        /**
         * Calls FindOne.
         * @param request HeroById message or plain object
         * @returns Promise
         */
        public findOne(request: hero.IHeroById): Promise<hero.Hero>;

        /**
         * Calls UpdateHero.
         * @param request Hero message or plain object
         * @param callback Node-style callback called with the error, if any, and Hero
         */
        public updateHero(request: hero.IHero, callback: hero.HeroesService.UpdateHeroCallback): void;

        /**
         * Calls UpdateHero.
         * @param request Hero message or plain object
         * @returns Promise
         */
        public updateHero(request: hero.IHero): Promise<hero.Hero>;
    }

    namespace HeroesService {

        /**
         * Callback as used by {@link hero.HeroesService#findOne}.
         * @param error Error, if any
         * @param [response] Hero
         */
        type FindOneCallback = (error: (Error|null), response?: hero.Hero) => void;

        /**
         * Callback as used by {@link hero.HeroesService#updateHero}.
         * @param error Error, if any
         * @param [response] Hero
         */
        type UpdateHeroCallback = (error: (Error|null), response?: hero.Hero) => void;
    }

    /** Properties of a HeroById. */
    interface IHeroById {

        /** HeroById id */
        id?: (number|null);
    }

    /** Represents a HeroById. */
    class HeroById implements IHeroById {

        /**
         * Constructs a new HeroById.
         * @param [properties] Properties to set
         */
        constructor(properties?: hero.IHeroById);

        /** HeroById id. */
        public id: number;

        /**
         * Creates a new HeroById instance using the specified properties.
         * @param [properties] Properties to set
         * @returns HeroById instance
         */
        public static create(properties?: hero.IHeroById): hero.HeroById;

        /**
         * Verifies a HeroById message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a HeroById message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns HeroById
         */
        public static fromObject(object: { [k: string]: any }): hero.HeroById;

        /**
         * Creates a plain object from a HeroById message. Also converts values to other types if specified.
         * @param message HeroById
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: hero.HeroById, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this HeroById to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for HeroById
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a Hero. */
    interface IHero {

        /** Hero id */
        id?: (number|null);

        /** Hero name */
        name?: (string|null);
    }

    /** Represents a Hero. */
    class Hero implements IHero {

        /**
         * Constructs a new Hero.
         * @param [properties] Properties to set
         */
        constructor(properties?: hero.IHero);

        /** Hero id. */
        public id: number;

        /** Hero name. */
        public name: string;

        /**
         * Creates a new Hero instance using the specified properties.
         * @param [properties] Properties to set
         * @returns Hero instance
         */
        public static create(properties?: hero.IHero): hero.Hero;

        /**
         * Verifies a Hero message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a Hero message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns Hero
         */
        public static fromObject(object: { [k: string]: any }): hero.Hero;

        /**
         * Creates a plain object from a Hero message. Also converts values to other types if specified.
         * @param message Hero
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: hero.Hero, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this Hero to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for Hero
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }
}
