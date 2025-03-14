// var parseArgs = require('minimist');
// var messages = require('./helloworld_pb');
// var services = require('../libs/microrpc/src/protos/hero.js');

/*
 *
 * Copyright 2015 gRPC authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

var messages = require('../libs/microrpc/src/protos/gen/hero_pb');
var services = require('../libs/microrpc/src/protos/gen/hero_grpc_pb');

var grpc = require('@grpc/grpc-js');

function main() {
  var target = 'localhost:3010';
  var client = new services.HeroesServiceClient(
    target,
    grpc.credentials.createInsecure(),
  );
  var request = new messages.HeroById();
  request.setId(1);
  console.log('request', request);

  //   request.setName(user);
  client.findOne(request, function (err, response) {
    console.log('response:', response.toObject(), err);
  });
}

main();
