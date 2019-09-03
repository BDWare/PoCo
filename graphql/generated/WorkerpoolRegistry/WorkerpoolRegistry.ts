// THIS IS AN AUTOGENERATED FILE. DO NOT EDIT THIS FILE DIRECTLY.

import {
  EthereumCall,
  EthereumEvent,
  SmartContract,
  EthereumValue,
  JSONValue,
  TypedMap,
  Entity,
  EthereumTuple,
  Bytes,
  Address,
  BigInt
} from "@graphprotocol/graph-ts";

export class CreateWorkerpool extends EthereumEvent {
  get params(): CreateWorkerpool__Params {
    return new CreateWorkerpool__Params(this);
  }
}

export class CreateWorkerpool__Params {
  _event: CreateWorkerpool;

  constructor(event: CreateWorkerpool) {
    this._event = event;
  }

  get workerpoolOwner(): Address {
    return this._event.parameters[0].value.toAddress();
  }

  get workerpool(): Address {
    return this._event.parameters[1].value.toAddress();
  }

  get workerpoolDescription(): string {
    return this._event.parameters[2].value.toString();
  }
}

export class WorkerpoolRegistry extends SmartContract {
  static bind(address: Address): WorkerpoolRegistry {
    return new WorkerpoolRegistry("WorkerpoolRegistry", address);
  }

  viewEntry(_owner: Address, _index: BigInt): Address {
    let result = super.call("viewEntry", [
      EthereumValue.fromAddress(_owner),
      EthereumValue.fromUnsignedBigInt(_index)
    ]);
    return result[0].toAddress();
  }

  viewCount(_owner: Address): BigInt {
    let result = super.call("viewCount", [EthereumValue.fromAddress(_owner)]);
    return result[0].toBigInt();
  }

  isRegistered(_entry: Address): boolean {
    let result = super.call("isRegistered", [
      EthereumValue.fromAddress(_entry)
    ]);
    return result[0].toBoolean();
  }

  createWorkerpool(
    _workerpoolOwner: Address,
    _workerpoolDescription: string
  ): Address {
    let result = super.call("createWorkerpool", [
      EthereumValue.fromAddress(_workerpoolOwner),
      EthereumValue.fromString(_workerpoolDescription)
    ]);
    return result[0].toAddress();
  }
}

export class ConstructorCall extends EthereumCall {
  get inputs(): ConstructorCall__Inputs {
    return new ConstructorCall__Inputs(this);
  }

  get outputs(): ConstructorCall__Outputs {
    return new ConstructorCall__Outputs(this);
  }
}

export class ConstructorCall__Inputs {
  _call: ConstructorCall;

  constructor(call: ConstructorCall) {
    this._call = call;
  }
}

export class ConstructorCall__Outputs {
  _call: ConstructorCall;

  constructor(call: ConstructorCall) {
    this._call = call;
  }
}

export class CreateWorkerpoolCall extends EthereumCall {
  get inputs(): CreateWorkerpoolCall__Inputs {
    return new CreateWorkerpoolCall__Inputs(this);
  }

  get outputs(): CreateWorkerpoolCall__Outputs {
    return new CreateWorkerpoolCall__Outputs(this);
  }
}

export class CreateWorkerpoolCall__Inputs {
  _call: CreateWorkerpoolCall;

  constructor(call: CreateWorkerpoolCall) {
    this._call = call;
  }

  get _workerpoolOwner(): Address {
    return this._call.inputValues[0].value.toAddress();
  }

  get _workerpoolDescription(): string {
    return this._call.inputValues[1].value.toString();
  }
}

export class CreateWorkerpoolCall__Outputs {
  _call: CreateWorkerpoolCall;

  constructor(call: CreateWorkerpoolCall) {
    this._call = call;
  }

  get value0(): Address {
    return this._call.outputValues[0].value.toAddress();
  }
}