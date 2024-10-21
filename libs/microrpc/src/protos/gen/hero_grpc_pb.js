// GENERATED CODE -- DO NOT EDIT!

// Original file comments:
// hero/hero.proto
'use strict';
var grpc = require('@grpc/grpc-js');
var hero_pb = require('./hero_pb.js');

function serialize_hero_Hero(arg) {
  if (!(arg instanceof hero_pb.Hero)) {
    throw new Error('Expected argument of type hero.Hero');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_hero_Hero(buffer_arg) {
  return hero_pb.Hero.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_hero_HeroById(arg) {
  if (!(arg instanceof hero_pb.HeroById)) {
    throw new Error('Expected argument of type hero.HeroById');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_hero_HeroById(buffer_arg) {
  return hero_pb.HeroById.deserializeBinary(new Uint8Array(buffer_arg));
}


var HeroesServiceService = exports.HeroesServiceService = {
  findOne: {
    path: '/hero.HeroesService/FindOne',
    requestStream: false,
    responseStream: false,
    requestType: hero_pb.HeroById,
    responseType: hero_pb.Hero,
    requestSerialize: serialize_hero_HeroById,
    requestDeserialize: deserialize_hero_HeroById,
    responseSerialize: serialize_hero_Hero,
    responseDeserialize: deserialize_hero_Hero,
  },
};

exports.HeroesServiceClient = grpc.makeGenericClientConstructor(HeroesServiceService, 'HeroesService');
