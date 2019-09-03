// THIS IS AN AUTOGENERATED FILE. DO NOT EDIT THIS FILE DIRECTLY.

import {
  TypedMap,
  Entity,
  Value,
  ValueKind,
  store,
  Address,
  Bytes,
  BigInt,
  BigDecimal
} from "@graphprotocol/graph-ts";

export class App extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));
  }

  save(): void {
    let id = this.get("id");
    assert(id !== null, "Cannot save App entity without an ID");
    assert(
      id.kind == ValueKind.STRING,
      "Cannot save App entity with non-string ID. " +
        'Considering using .toHex() to convert the "id" to a string.'
    );
    store.set("App", id.toString(), this);
  }

  static load(id: string): App | null {
    return store.get("App", id) as App | null;
  }

  get id(): string {
    let value = this.get("id");
    return value.toString();
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get owner(): string | null {
    let value = this.get("owner");
    if (value === null) {
      return null;
    } else {
      return value.toString();
    }
  }

  set owner(value: string | null) {
    if (value === null) {
      this.unset("owner");
    } else {
      this.set("owner", Value.fromString(value as string));
    }
  }

  get name(): string | null {
    let value = this.get("name");
    if (value === null) {
      return null;
    } else {
      return value.toString();
    }
  }

  set name(value: string | null) {
    if (value === null) {
      this.unset("name");
    } else {
      this.set("name", Value.fromString(value as string));
    }
  }

  get type(): string | null {
    let value = this.get("type");
    if (value === null) {
      return null;
    } else {
      return value.toString();
    }
  }

  set type(value: string | null) {
    if (value === null) {
      this.unset("type");
    } else {
      this.set("type", Value.fromString(value as string));
    }
  }

  get multiaddr(): Bytes | null {
    let value = this.get("multiaddr");
    if (value === null) {
      return null;
    } else {
      return value.toBytes();
    }
  }

  set multiaddr(value: Bytes | null) {
    if (value === null) {
      this.unset("multiaddr");
    } else {
      this.set("multiaddr", Value.fromBytes(value as Bytes));
    }
  }

  get checksum(): string | null {
    let value = this.get("checksum");
    if (value === null) {
      return null;
    } else {
      return value.toString();
    }
  }

  set checksum(value: string | null) {
    if (value === null) {
      this.unset("checksum");
    } else {
      this.set("checksum", Value.fromString(value as string));
    }
  }

  get mrenclave(): Bytes | null {
    let value = this.get("mrenclave");
    if (value === null) {
      return null;
    } else {
      return value.toBytes();
    }
  }

  set mrenclave(value: Bytes | null) {
    if (value === null) {
      this.unset("mrenclave");
    } else {
      this.set("mrenclave", Value.fromBytes(value as Bytes));
    }
  }
}

export class Dataset extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));
  }

  save(): void {
    let id = this.get("id");
    assert(id !== null, "Cannot save Dataset entity without an ID");
    assert(
      id.kind == ValueKind.STRING,
      "Cannot save Dataset entity with non-string ID. " +
        'Considering using .toHex() to convert the "id" to a string.'
    );
    store.set("Dataset", id.toString(), this);
  }

  static load(id: string): Dataset | null {
    return store.get("Dataset", id) as Dataset | null;
  }

  get id(): string {
    let value = this.get("id");
    return value.toString();
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get owner(): string | null {
    let value = this.get("owner");
    if (value === null) {
      return null;
    } else {
      return value.toString();
    }
  }

  set owner(value: string | null) {
    if (value === null) {
      this.unset("owner");
    } else {
      this.set("owner", Value.fromString(value as string));
    }
  }

  get name(): string | null {
    let value = this.get("name");
    if (value === null) {
      return null;
    } else {
      return value.toString();
    }
  }

  set name(value: string | null) {
    if (value === null) {
      this.unset("name");
    } else {
      this.set("name", Value.fromString(value as string));
    }
  }

  get multiaddr(): Bytes | null {
    let value = this.get("multiaddr");
    if (value === null) {
      return null;
    } else {
      return value.toBytes();
    }
  }

  set multiaddr(value: Bytes | null) {
    if (value === null) {
      this.unset("multiaddr");
    } else {
      this.set("multiaddr", Value.fromBytes(value as Bytes));
    }
  }

  get checksum(): string | null {
    let value = this.get("checksum");
    if (value === null) {
      return null;
    } else {
      return value.toString();
    }
  }

  set checksum(value: string | null) {
    if (value === null) {
      this.unset("checksum");
    } else {
      this.set("checksum", Value.fromString(value as string));
    }
  }
}

export class Workerpool extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));
  }

  save(): void {
    let id = this.get("id");
    assert(id !== null, "Cannot save Workerpool entity without an ID");
    assert(
      id.kind == ValueKind.STRING,
      "Cannot save Workerpool entity with non-string ID. " +
        'Considering using .toHex() to convert the "id" to a string.'
    );
    store.set("Workerpool", id.toString(), this);
  }

  static load(id: string): Workerpool | null {
    return store.get("Workerpool", id) as Workerpool | null;
  }

  get id(): string {
    let value = this.get("id");
    return value.toString();
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get owner(): string | null {
    let value = this.get("owner");
    if (value === null) {
      return null;
    } else {
      return value.toString();
    }
  }

  set owner(value: string | null) {
    if (value === null) {
      this.unset("owner");
    } else {
      this.set("owner", Value.fromString(value as string));
    }
  }

  get description(): string | null {
    let value = this.get("description");
    if (value === null) {
      return null;
    } else {
      return value.toString();
    }
  }

  set description(value: string | null) {
    if (value === null) {
      this.unset("description");
    } else {
      this.set("description", Value.fromString(value as string));
    }
  }

  get workerStakeRatio(): BigInt | null {
    let value = this.get("workerStakeRatio");
    if (value === null) {
      return null;
    } else {
      return value.toBigInt();
    }
  }

  set workerStakeRatio(value: BigInt | null) {
    if (value === null) {
      this.unset("workerStakeRatio");
    } else {
      this.set("workerStakeRatio", Value.fromBigInt(value as BigInt));
    }
  }

  get schedulerRewardRatio(): BigInt | null {
    let value = this.get("schedulerRewardRatio");
    if (value === null) {
      return null;
    } else {
      return value.toBigInt();
    }
  }

  set schedulerRewardRatio(value: BigInt | null) {
    if (value === null) {
      this.unset("schedulerRewardRatio");
    } else {
      this.set("schedulerRewardRatio", Value.fromBigInt(value as BigInt));
    }
  }
}

export class Category extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));
  }

  save(): void {
    let id = this.get("id");
    assert(id !== null, "Cannot save Category entity without an ID");
    assert(
      id.kind == ValueKind.STRING,
      "Cannot save Category entity with non-string ID. " +
        'Considering using .toHex() to convert the "id" to a string.'
    );
    store.set("Category", id.toString(), this);
  }

  static load(id: string): Category | null {
    return store.get("Category", id) as Category | null;
  }

  get id(): string {
    let value = this.get("id");
    return value.toString();
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get name(): string | null {
    let value = this.get("name");
    if (value === null) {
      return null;
    } else {
      return value.toString();
    }
  }

  set name(value: string | null) {
    if (value === null) {
      this.unset("name");
    } else {
      this.set("name", Value.fromString(value as string));
    }
  }

  get description(): string | null {
    let value = this.get("description");
    if (value === null) {
      return null;
    } else {
      return value.toString();
    }
  }

  set description(value: string | null) {
    if (value === null) {
      this.unset("description");
    } else {
      this.set("description", Value.fromString(value as string));
    }
  }

  get workClockTimeRef(): BigInt | null {
    let value = this.get("workClockTimeRef");
    if (value === null) {
      return null;
    } else {
      return value.toBigInt();
    }
  }

  set workClockTimeRef(value: BigInt | null) {
    if (value === null) {
      this.unset("workClockTimeRef");
    } else {
      this.set("workClockTimeRef", Value.fromBigInt(value as BigInt));
    }
  }
}

export class Deal extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));
  }

  save(): void {
    let id = this.get("id");
    assert(id !== null, "Cannot save Deal entity without an ID");
    assert(
      id.kind == ValueKind.STRING,
      "Cannot save Deal entity with non-string ID. " +
        'Considering using .toHex() to convert the "id" to a string.'
    );
    store.set("Deal", id.toString(), this);
  }

  static load(id: string): Deal | null {
    return store.get("Deal", id) as Deal | null;
  }

  get id(): string {
    let value = this.get("id");
    return value.toString();
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get app(): string | null {
    let value = this.get("app");
    if (value === null) {
      return null;
    } else {
      return value.toString();
    }
  }

  set app(value: string | null) {
    if (value === null) {
      this.unset("app");
    } else {
      this.set("app", Value.fromString(value as string));
    }
  }

  get appOwner(): string | null {
    let value = this.get("appOwner");
    if (value === null) {
      return null;
    } else {
      return value.toString();
    }
  }

  set appOwner(value: string | null) {
    if (value === null) {
      this.unset("appOwner");
    } else {
      this.set("appOwner", Value.fromString(value as string));
    }
  }

  get appPrice(): BigInt | null {
    let value = this.get("appPrice");
    if (value === null) {
      return null;
    } else {
      return value.toBigInt();
    }
  }

  set appPrice(value: BigInt | null) {
    if (value === null) {
      this.unset("appPrice");
    } else {
      this.set("appPrice", Value.fromBigInt(value as BigInt));
    }
  }

  get dataset(): string | null {
    let value = this.get("dataset");
    if (value === null) {
      return null;
    } else {
      return value.toString();
    }
  }

  set dataset(value: string | null) {
    if (value === null) {
      this.unset("dataset");
    } else {
      this.set("dataset", Value.fromString(value as string));
    }
  }

  get datasetOwner(): string | null {
    let value = this.get("datasetOwner");
    if (value === null) {
      return null;
    } else {
      return value.toString();
    }
  }

  set datasetOwner(value: string | null) {
    if (value === null) {
      this.unset("datasetOwner");
    } else {
      this.set("datasetOwner", Value.fromString(value as string));
    }
  }

  get datasetPrice(): BigInt | null {
    let value = this.get("datasetPrice");
    if (value === null) {
      return null;
    } else {
      return value.toBigInt();
    }
  }

  set datasetPrice(value: BigInt | null) {
    if (value === null) {
      this.unset("datasetPrice");
    } else {
      this.set("datasetPrice", Value.fromBigInt(value as BigInt));
    }
  }

  get workerpool(): string | null {
    let value = this.get("workerpool");
    if (value === null) {
      return null;
    } else {
      return value.toString();
    }
  }

  set workerpool(value: string | null) {
    if (value === null) {
      this.unset("workerpool");
    } else {
      this.set("workerpool", Value.fromString(value as string));
    }
  }

  get workerpoolOwner(): string | null {
    let value = this.get("workerpoolOwner");
    if (value === null) {
      return null;
    } else {
      return value.toString();
    }
  }

  set workerpoolOwner(value: string | null) {
    if (value === null) {
      this.unset("workerpoolOwner");
    } else {
      this.set("workerpoolOwner", Value.fromString(value as string));
    }
  }

  get workerpoolPrice(): BigInt | null {
    let value = this.get("workerpoolPrice");
    if (value === null) {
      return null;
    } else {
      return value.toBigInt();
    }
  }

  set workerpoolPrice(value: BigInt | null) {
    if (value === null) {
      this.unset("workerpoolPrice");
    } else {
      this.set("workerpoolPrice", Value.fromBigInt(value as BigInt));
    }
  }

  get trust(): BigInt | null {
    let value = this.get("trust");
    if (value === null) {
      return null;
    } else {
      return value.toBigInt();
    }
  }

  set trust(value: BigInt | null) {
    if (value === null) {
      this.unset("trust");
    } else {
      this.set("trust", Value.fromBigInt(value as BigInt));
    }
  }

  get category(): string | null {
    let value = this.get("category");
    if (value === null) {
      return null;
    } else {
      return value.toString();
    }
  }

  set category(value: string | null) {
    if (value === null) {
      this.unset("category");
    } else {
      this.set("category", Value.fromString(value as string));
    }
  }

  get tag(): string | null {
    let value = this.get("tag");
    if (value === null) {
      return null;
    } else {
      return value.toString();
    }
  }

  set tag(value: string | null) {
    if (value === null) {
      this.unset("tag");
    } else {
      this.set("tag", Value.fromString(value as string));
    }
  }

  get requester(): string | null {
    let value = this.get("requester");
    if (value === null) {
      return null;
    } else {
      return value.toString();
    }
  }

  set requester(value: string | null) {
    if (value === null) {
      this.unset("requester");
    } else {
      this.set("requester", Value.fromString(value as string));
    }
  }

  get beneficiary(): string | null {
    let value = this.get("beneficiary");
    if (value === null) {
      return null;
    } else {
      return value.toString();
    }
  }

  set beneficiary(value: string | null) {
    if (value === null) {
      this.unset("beneficiary");
    } else {
      this.set("beneficiary", Value.fromString(value as string));
    }
  }

  get callback(): string | null {
    let value = this.get("callback");
    if (value === null) {
      return null;
    } else {
      return value.toString();
    }
  }

  set callback(value: string | null) {
    if (value === null) {
      this.unset("callback");
    } else {
      this.set("callback", Value.fromString(value as string));
    }
  }

  get params(): string | null {
    let value = this.get("params");
    if (value === null) {
      return null;
    } else {
      return value.toString();
    }
  }

  set params(value: string | null) {
    if (value === null) {
      this.unset("params");
    } else {
      this.set("params", Value.fromString(value as string));
    }
  }

  get startTime(): BigInt | null {
    let value = this.get("startTime");
    if (value === null) {
      return null;
    } else {
      return value.toBigInt();
    }
  }

  set startTime(value: BigInt | null) {
    if (value === null) {
      this.unset("startTime");
    } else {
      this.set("startTime", Value.fromBigInt(value as BigInt));
    }
  }

  get botFirst(): BigInt | null {
    let value = this.get("botFirst");
    if (value === null) {
      return null;
    } else {
      return value.toBigInt();
    }
  }

  set botFirst(value: BigInt | null) {
    if (value === null) {
      this.unset("botFirst");
    } else {
      this.set("botFirst", Value.fromBigInt(value as BigInt));
    }
  }

  get botSize(): BigInt | null {
    let value = this.get("botSize");
    if (value === null) {
      return null;
    } else {
      return value.toBigInt();
    }
  }

  set botSize(value: BigInt | null) {
    if (value === null) {
      this.unset("botSize");
    } else {
      this.set("botSize", Value.fromBigInt(value as BigInt));
    }
  }

  get workerStake(): BigInt | null {
    let value = this.get("workerStake");
    if (value === null) {
      return null;
    } else {
      return value.toBigInt();
    }
  }

  set workerStake(value: BigInt | null) {
    if (value === null) {
      this.unset("workerStake");
    } else {
      this.set("workerStake", Value.fromBigInt(value as BigInt));
    }
  }

  get schedulerRewardRatio(): BigInt | null {
    let value = this.get("schedulerRewardRatio");
    if (value === null) {
      return null;
    } else {
      return value.toBigInt();
    }
  }

  set schedulerRewardRatio(value: BigInt | null) {
    if (value === null) {
      this.unset("schedulerRewardRatio");
    } else {
      this.set("schedulerRewardRatio", Value.fromBigInt(value as BigInt));
    }
  }
}

export class Task extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));
  }

  save(): void {
    let id = this.get("id");
    assert(id !== null, "Cannot save Task entity without an ID");
    assert(
      id.kind == ValueKind.STRING,
      "Cannot save Task entity with non-string ID. " +
        'Considering using .toHex() to convert the "id" to a string.'
    );
    store.set("Task", id.toString(), this);
  }

  static load(id: string): Task | null {
    return store.get("Task", id) as Task | null;
  }

  get id(): string {
    let value = this.get("id");
    return value.toString();
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get status(): string | null {
    let value = this.get("status");
    if (value === null) {
      return null;
    } else {
      return value.toString();
    }
  }

  set status(value: string | null) {
    if (value === null) {
      this.unset("status");
    } else {
      this.set("status", Value.fromString(value as string));
    }
  }

  get index(): BigInt | null {
    let value = this.get("index");
    if (value === null) {
      return null;
    } else {
      return value.toBigInt();
    }
  }

  set index(value: BigInt | null) {
    if (value === null) {
      this.unset("index");
    } else {
      this.set("index", Value.fromBigInt(value as BigInt));
    }
  }

  get dealid(): string | null {
    let value = this.get("dealid");
    if (value === null) {
      return null;
    } else {
      return value.toString();
    }
  }

  set dealid(value: string | null) {
    if (value === null) {
      this.unset("dealid");
    } else {
      this.set("dealid", Value.fromString(value as string));
    }
  }

  get contributions(): Array<string> {
    let value = this.get("contributions");
    return value.toStringArray();
  }

  set contributions(value: Array<string>) {
    this.set("contributions", Value.fromStringArray(value));
  }

  get resultDigest(): string | null {
    let value = this.get("resultDigest");
    if (value === null) {
      return null;
    } else {
      return value.toString();
    }
  }

  set resultDigest(value: string | null) {
    if (value === null) {
      this.unset("resultDigest");
    } else {
      this.set("resultDigest", Value.fromString(value as string));
    }
  }

  get results(): string | null {
    let value = this.get("results");
    if (value === null) {
      return null;
    } else {
      return value.toString();
    }
  }

  set results(value: string | null) {
    if (value === null) {
      this.unset("results");
    } else {
      this.set("results", Value.fromString(value as string));
    }
  }

  get contributionDeadline(): BigInt | null {
    let value = this.get("contributionDeadline");
    if (value === null) {
      return null;
    } else {
      return value.toBigInt();
    }
  }

  set contributionDeadline(value: BigInt | null) {
    if (value === null) {
      this.unset("contributionDeadline");
    } else {
      this.set("contributionDeadline", Value.fromBigInt(value as BigInt));
    }
  }

  get revealDeadline(): BigInt | null {
    let value = this.get("revealDeadline");
    if (value === null) {
      return null;
    } else {
      return value.toBigInt();
    }
  }

  set revealDeadline(value: BigInt | null) {
    if (value === null) {
      this.unset("revealDeadline");
    } else {
      this.set("revealDeadline", Value.fromBigInt(value as BigInt));
    }
  }

  get finalDeadline(): BigInt | null {
    let value = this.get("finalDeadline");
    if (value === null) {
      return null;
    } else {
      return value.toBigInt();
    }
  }

  set finalDeadline(value: BigInt | null) {
    if (value === null) {
      this.unset("finalDeadline");
    } else {
      this.set("finalDeadline", Value.fromBigInt(value as BigInt));
    }
  }

  get consensusValue(): string | null {
    let value = this.get("consensusValue");
    if (value === null) {
      return null;
    } else {
      return value.toString();
    }
  }

  set consensusValue(value: string | null) {
    if (value === null) {
      this.unset("consensusValue");
    } else {
      this.set("consensusValue", Value.fromString(value as string));
    }
  }
}

export class Contribution extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));
  }

  save(): void {
    let id = this.get("id");
    assert(id !== null, "Cannot save Contribution entity without an ID");
    assert(
      id.kind == ValueKind.STRING,
      "Cannot save Contribution entity with non-string ID. " +
        'Considering using .toHex() to convert the "id" to a string.'
    );
    store.set("Contribution", id.toString(), this);
  }

  static load(id: string): Contribution | null {
    return store.get("Contribution", id) as Contribution | null;
  }

  get id(): string {
    let value = this.get("id");
    return value.toString();
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get status(): string | null {
    let value = this.get("status");
    if (value === null) {
      return null;
    } else {
      return value.toString();
    }
  }

  set status(value: string | null) {
    if (value === null) {
      this.unset("status");
    } else {
      this.set("status", Value.fromString(value as string));
    }
  }

  get worker(): string | null {
    let value = this.get("worker");
    if (value === null) {
      return null;
    } else {
      return value.toString();
    }
  }

  set worker(value: string | null) {
    if (value === null) {
      this.unset("worker");
    } else {
      this.set("worker", Value.fromString(value as string));
    }
  }

  get hash(): string | null {
    let value = this.get("hash");
    if (value === null) {
      return null;
    } else {
      return value.toString();
    }
  }

  set hash(value: string | null) {
    if (value === null) {
      this.unset("hash");
    } else {
      this.set("hash", Value.fromString(value as string));
    }
  }

  get seal(): string | null {
    let value = this.get("seal");
    if (value === null) {
      return null;
    } else {
      return value.toString();
    }
  }

  set seal(value: string | null) {
    if (value === null) {
      this.unset("seal");
    } else {
      this.set("seal", Value.fromString(value as string));
    }
  }

  get challenge(): string | null {
    let value = this.get("challenge");
    if (value === null) {
      return null;
    } else {
      return value.toString();
    }
  }

  set challenge(value: string | null) {
    if (value === null) {
      this.unset("challenge");
    } else {
      this.set("challenge", Value.fromString(value as string));
    }
  }
}

export class AccountDeposit extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));
  }

  save(): void {
    let id = this.get("id");
    assert(id !== null, "Cannot save AccountDeposit entity without an ID");
    assert(
      id.kind == ValueKind.STRING,
      "Cannot save AccountDeposit entity with non-string ID. " +
        'Considering using .toHex() to convert the "id" to a string.'
    );
    store.set("AccountDeposit", id.toString(), this);
  }

  static load(id: string): AccountDeposit | null {
    return store.get("AccountDeposit", id) as AccountDeposit | null;
  }

  get id(): string {
    let value = this.get("id");
    return value.toString();
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get account(): string {
    let value = this.get("account");
    return value.toString();
  }

  set account(value: string) {
    this.set("account", Value.fromString(value));
  }

  get value(): BigInt {
    let value = this.get("value");
    return value.toBigInt();
  }

  set value(value: BigInt) {
    this.set("value", Value.fromBigInt(value));
  }

  get sender(): string {
    let value = this.get("sender");
    return value.toString();
  }

  set sender(value: string) {
    this.set("sender", Value.fromString(value));
  }
}

export class AccountWithdraw extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));
  }

  save(): void {
    let id = this.get("id");
    assert(id !== null, "Cannot save AccountWithdraw entity without an ID");
    assert(
      id.kind == ValueKind.STRING,
      "Cannot save AccountWithdraw entity with non-string ID. " +
        'Considering using .toHex() to convert the "id" to a string.'
    );
    store.set("AccountWithdraw", id.toString(), this);
  }

  static load(id: string): AccountWithdraw | null {
    return store.get("AccountWithdraw", id) as AccountWithdraw | null;
  }

  get id(): string {
    let value = this.get("id");
    return value.toString();
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get account(): string {
    let value = this.get("account");
    return value.toString();
  }

  set account(value: string) {
    this.set("account", Value.fromString(value));
  }

  get value(): BigInt {
    let value = this.get("value");
    return value.toBigInt();
  }

  set value(value: BigInt) {
    this.set("value", Value.fromBigInt(value));
  }

  get receiver(): string {
    let value = this.get("receiver");
    return value.toString();
  }

  set receiver(value: string) {
    this.set("receiver", Value.fromString(value));
  }
}

export class AccountReward extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));
  }

  save(): void {
    let id = this.get("id");
    assert(id !== null, "Cannot save AccountReward entity without an ID");
    assert(
      id.kind == ValueKind.STRING,
      "Cannot save AccountReward entity with non-string ID. " +
        'Considering using .toHex() to convert the "id" to a string.'
    );
    store.set("AccountReward", id.toString(), this);
  }

  static load(id: string): AccountReward | null {
    return store.get("AccountReward", id) as AccountReward | null;
  }

  get id(): string {
    let value = this.get("id");
    return value.toString();
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get account(): string {
    let value = this.get("account");
    return value.toString();
  }

  set account(value: string) {
    this.set("account", Value.fromString(value));
  }

  get value(): BigInt {
    let value = this.get("value");
    return value.toBigInt();
  }

  set value(value: BigInt) {
    this.set("value", Value.fromBigInt(value));
  }

  get task(): string {
    let value = this.get("task");
    return value.toString();
  }

  set task(value: string) {
    this.set("task", Value.fromString(value));
  }
}

export class AccountSeize extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));
  }

  save(): void {
    let id = this.get("id");
    assert(id !== null, "Cannot save AccountSeize entity without an ID");
    assert(
      id.kind == ValueKind.STRING,
      "Cannot save AccountSeize entity with non-string ID. " +
        'Considering using .toHex() to convert the "id" to a string.'
    );
    store.set("AccountSeize", id.toString(), this);
  }

  static load(id: string): AccountSeize | null {
    return store.get("AccountSeize", id) as AccountSeize | null;
  }

  get id(): string {
    let value = this.get("id");
    return value.toString();
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get account(): string {
    let value = this.get("account");
    return value.toString();
  }

  set account(value: string) {
    this.set("account", Value.fromString(value));
  }

  get value(): BigInt {
    let value = this.get("value");
    return value.toBigInt();
  }

  set value(value: BigInt) {
    this.set("value", Value.fromBigInt(value));
  }

  get task(): string {
    let value = this.get("task");
    return value.toString();
  }

  set task(value: string) {
    this.set("task", Value.fromString(value));
  }
}

export class AccountLock extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));
  }

  save(): void {
    let id = this.get("id");
    assert(id !== null, "Cannot save AccountLock entity without an ID");
    assert(
      id.kind == ValueKind.STRING,
      "Cannot save AccountLock entity with non-string ID. " +
        'Considering using .toHex() to convert the "id" to a string.'
    );
    store.set("AccountLock", id.toString(), this);
  }

  static load(id: string): AccountLock | null {
    return store.get("AccountLock", id) as AccountLock | null;
  }

  get id(): string {
    let value = this.get("id");
    return value.toString();
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get account(): string {
    let value = this.get("account");
    return value.toString();
  }

  set account(value: string) {
    this.set("account", Value.fromString(value));
  }

  get value(): BigInt {
    let value = this.get("value");
    return value.toBigInt();
  }

  set value(value: BigInt) {
    this.set("value", Value.fromBigInt(value));
  }
}

export class AccountUnlock extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));
  }

  save(): void {
    let id = this.get("id");
    assert(id !== null, "Cannot save AccountUnlock entity without an ID");
    assert(
      id.kind == ValueKind.STRING,
      "Cannot save AccountUnlock entity with non-string ID. " +
        'Considering using .toHex() to convert the "id" to a string.'
    );
    store.set("AccountUnlock", id.toString(), this);
  }

  static load(id: string): AccountUnlock | null {
    return store.get("AccountUnlock", id) as AccountUnlock | null;
  }

  get id(): string {
    let value = this.get("id");
    return value.toString();
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get account(): string {
    let value = this.get("account");
    return value.toString();
  }

  set account(value: string) {
    this.set("account", Value.fromString(value));
  }

  get value(): BigInt {
    let value = this.get("value");
    return value.toBigInt();
  }

  set value(value: BigInt) {
    this.set("value", Value.fromBigInt(value));
  }
}
