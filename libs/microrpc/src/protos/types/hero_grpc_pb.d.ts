// package: hero
// file: hero.proto

/* tslint:disable */
/* eslint-disable */

import * as grpc from "grpc";
import * as hero_pb from "./hero_pb";

interface IHeroesServiceService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
    findOne: IHeroesServiceService_IFindOne;
}

interface IHeroesServiceService_IFindOne extends grpc.MethodDefinition<hero_pb.HeroById, hero_pb.Hero> {
    path: "/hero.HeroesService/FindOne";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<hero_pb.HeroById>;
    requestDeserialize: grpc.deserialize<hero_pb.HeroById>;
    responseSerialize: grpc.serialize<hero_pb.Hero>;
    responseDeserialize: grpc.deserialize<hero_pb.Hero>;
}

export const HeroesServiceService: IHeroesServiceService;

export interface IHeroesServiceServer {
    findOne: grpc.handleUnaryCall<hero_pb.HeroById, hero_pb.Hero>;
}

export interface IHeroesServiceClient {
    findOne(request: hero_pb.HeroById, callback: (error: grpc.ServiceError | null, response: hero_pb.Hero) => void): grpc.ClientUnaryCall;
    findOne(request: hero_pb.HeroById, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: hero_pb.Hero) => void): grpc.ClientUnaryCall;
    findOne(request: hero_pb.HeroById, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: hero_pb.Hero) => void): grpc.ClientUnaryCall;
}

export class HeroesServiceClient extends grpc.Client implements IHeroesServiceClient {
    constructor(address: string, credentials: grpc.ChannelCredentials, options?: object);
    public findOne(request: hero_pb.HeroById, callback: (error: grpc.ServiceError | null, response: hero_pb.Hero) => void): grpc.ClientUnaryCall;
    public findOne(request: hero_pb.HeroById, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: hero_pb.Hero) => void): grpc.ClientUnaryCall;
    public findOne(request: hero_pb.HeroById, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: hero_pb.Hero) => void): grpc.ClientUnaryCall;
}
