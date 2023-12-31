# LI.FI <> Gateway

> [!IMPORTANT]
> Please reference Handover Documentation before spawning this project:
> - [LI.FI Handover Document](https://www.notion.so/mygateway/Li-Fi-Loyalty-Pass-Issuance-Handover-5a178de816534ef9b0a871aca3ac318d?pvs=4)

**Table of Contents**
- [Getting Started](#getting-started)
- [Available Endpoints](#available-endpoints)
	- [POST /stats/wallet](#post-statswallet)
	- [POST /issue/credential](#post-issuecredential)
	- [POST /issue/loyalty-pass](#post-issueloyalty-pass)

## Getting Started
1. Install project dependencies
	```
	<!-- npm -->
	npm i

	<!-- yarn -->
	yarn

	<!-- pnpm -->
	pnpm i
	```

2. (optional) Start local Redis container
	```
	<!-- npm -->
	npm run redis

	<!-- yarn -->
	yarn redis

	<!-- pnpm -->
	pnpm redis
	```

3. Start Server

	__Development__:
	```
	<!-- npm -->
	npm run dev

	<!-- yarn -->
	yarn dev

	<!-- pnpm -->
	pnpm dev
	```

	__Production__:
	```
	<!-- npm -->
	npm start

	<!-- yarn -->
	yarn start

	<!-- pnpm -->
	pnmp start
	```

4. (optional) Tear down Redis container
	```
	<!-- npm -->
	npm run redis:stop

	<!-- yarn -->
	yarn redis:stop

	<!-- pnpm -->
	pnpm redis:stop
	```


## Available Endpoints

### POST /stats/wallet
> Generates JSON list of [GatewayMetrics](./src/utils/analytics.ts#L4)

**Headers**:
- __month__: reference [Month enum](./src/utils/analytics.ts#L35)
- __(optional) input__: absolute path for input JSON file (default: `./data/input.json`)
- __(optional) output__: absolute path for output (default: `./data/output.json`)

### POST /issue/credential
> Enqueues Credential metadata to be issued by the `issue-credential` BullMQ Queue.

**Headers**:
- __credential__: Filepath to JSON list of GatewayMetrics for wallets (e.g. `./data/output.json`)

### POST /issue/loyalty-pass
> Enqueues list of wallets to be created or updated by the `create_or_update_loyalty_pass` BullMQ Queue.

**Headers**:
- __loyalty-pass__: Filepath to JSON list of wallets
