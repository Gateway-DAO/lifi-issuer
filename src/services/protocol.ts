import axios, { AxiosInstance } from "axios";
import { ethers } from "ethers";

export type Credential = {
  id: string;
  title: string;
  claim: object;
  arweaveInfo: {
    id: string;
    url: string;
    string: number;
  };
};

export class Gateway {
  wallet: ethers.Wallet | null = null;
  url: string = process.env.PROTOCOL_GRAPHQL_URL as string;
  jwt: string | null = process.env.PROTOCOL_API_JWT as string;

  api: AxiosInstance = axios.create({
    method: "post",
    baseURL: this.url,
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.PROTOCOL_API_KEY,
      ...(this.jwt && { Authorization: `Bearer ${this.jwt}` }),
    },
  });

  constructor(wallet: ethers.Wallet | null = null) {
    this.wallet = wallet;
  }

  /**
   * It creates a nonce for the user's wallet address
   * @returns A nonce
   */
  private async getNonce(): Promise<string> {
    try {
      const query = `
        mutation($wallet: String!) {
            createWalletNonce(input: {
                wallet: $wallet
            }) {
                message
            }
        }
    `;

      const data = {
        query,
        variables: {
          wallet: this.wallet.address,
        },
      };

      const res = await this.api({
        data,
      });

      return res.data.data.createWalletNonce.message;
    } catch (err) {
      throw new Error("Failed to get nonce");
    }
  }

  /**
   * It signs a nonce with the user's private key, and sends the signature to the server
   * @returns The token is being returned.
   */
  async login(wallet: ethers.Wallet | null = null): Promise<string> {
    if (wallet && !this.wallet) this.wallet = wallet;

    if (!this.wallet) throw new Error("No wallet provided");

    try {
      const message = await this.getNonce();

      const query = `
        mutation($wallet: String!, $signature: String!) {
            loginWallet(input: {
                wallet: $wallet
                signature: $signature
            }) {
                token
            }
        }
        `;

      const data = {
        query,
        variables: {
          wallet: this.wallet.address,
          signature: await this.wallet.signMessage(message),
        },
      };

      const res = await this.api({
        data,
      });

      this.jwt = res.data.data.loginWallet.token;

      return res.data.data.loginWallet.token;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.log(err?.response?.data?.errors || err);
      throw new Error("Failed to login");
    }
  }

  /**
   * This function issues a credential to a recipient
   * @param {string} recipient - The recipient's wallet address
   * @param {string} title - The title of the credential
   * @param {string} description - A description of the credential
   * @param claim - The claim data that will be stored in the credential.
   * @param {string[]} tags - An array of strings that will be used to categorize the credential.
   * @param {string} dataModelId - The ID of the data model that you want to use for this credential.
   * @param {string} [orgId] - The organization ID of the issuer. If not provided, the issuer will be
   * the user's wallet.
   * @returns The id, txHash, title, and claim of the credential that was just issued.
   */
  async issueCredential({
    recipient,
    title,
    image,
    description,
    expirationDate,
    claim,
    tags,
    dataModelId,
    orgId,
    updateConditions,
  }: {
    recipient: string;
    title: string;
    image?: string;
    description: string;
    claim: Record<string, any>;
    expirationDate?: Date;
    tags: string[];
    dataModelId: string;
    orgId?: string;
    updateConditions?: string;
  }): Promise<Credential> {
    try {
      const query = `
      mutation createCredential(
        $recipient: String!
        $title: String!
        $description: String!
        $image: String
        $claim: JSON!
        $tags: [String!]!
        $dataModelId: String!
        $orgId: String
        $updateConditions: String
        $expirationDate: DateTime
      ) {
        createCredential(
          createCredentialInput: {
            recipientUserIdentity: $recipient
            description: $description
            title: $title
            image: $image
            dataModelId: $dataModelId
            claim: $claim
            tags: $tags
            issuerOrganizationId: $orgId
            updateConditions: $updateConditions
            expirationDate: $expirationDate
          }
        ) {
          id
          title
          claim
          arweaveInfo
        }
      }
      `;

      const data = {
        query,
        variables: {
          recipient,
          title,
          description,
          claim,
          tags,
          dataModelId,
          orgId,
          image,
          updateConditions,
          expirationDate,
        },
      };

      const res = await this.api({
        data,
        headers: {
          Authorization: `Bearer ${this.jwt}`,
        },
      });

      if (res.data.errors) throw new Error(JSON.stringify(res.data.errors));

      return res.data.data.createCredential;
    } catch (err) {
      console.log(err?.response?.data?.errors || err);
      throw new Error("Failed to issue credential");
    }
  }

  /**
   * This is an async function that updates a credential with the given parameters and returns the
   * updated credential.
   * @param  - - `id`: a required string parameter representing the ID of the credential to be updated
   * @returns a Promise that resolves to a Record<string, any> object, which contains the updated
   * credential information such as id, txHash, title, and claim.
   */
  async updateCredential({
    id,
    title = null,
    image = null,
    description = null,
    updateConditions = null,
    claim,
  }: {
    id: string;
    title?: string;
    image?: string;
    description?: string;
    updateConditions?: string;
    claim: Record<string, any>;
  }): Promise<Record<string, any>> {
    try {
      const query = `
      mutation updateCredential(
        $id: String!
        $title: String
        $image: String
        $description: String
        $updateConditions: String
        $claim: JSON!
      ) {
        updateCredential(
          updateCredentialInput: {
            id: $id
            description: $description
            title: $title
            image: $image
            updateConditions: $updateConditions
            claim: $claim
          }
        ) {
          id
          txHash
          title
          claim
        }
      }
      `;

      const data = {
        query,
        variables: {
          id,
          updateConditions,
          ...(title && { title }),
          ...(image && { image }),
          ...(description && { description }),
          claim,
        },
      };

      const res = await this.api({
        data,
        headers: {
          Authorization: `Bearer ${this.jwt}`,
        },
      });

      if (res.data.errors) throw new Error(JSON.stringify(res.data.errors));

      return res.data.data.updateCredential;
    } catch (err) {
      console.log(err?.response?.data?.errors || err);
      throw new Error("Failed to update credential");
    }
  }

  /**
   * This function retrieves credentials data from an API or Lambda function and returns it as a
   * Promise.
   * @returns This function returns a Promise that resolves to a Record object containing information
   * about credentials.
   */
  async getCredentials(): Promise<Record<string, any>> {
    try {
      const query = `
      query {
        credentials {
          id
          title
          description
          claim
          tags
          dataModelId
          issuerUser {
            id
            gatewayId
          }
          issuerOrganization {
            id
            gatewayId
          }
          recipientUser {
            id
            gatewayId
          }
          txHash
        }
      }
      `;

      const data = {
        query,
      };

      const res = await this.api({
        data,
        headers: {
          Authorization: `Bearer ${this.jwt}`,
        },
      });

      if (res.data.errors) throw new Error(JSON.stringify(res.data.errors));

      return res.data.data.credentials;
    } catch (err) {
      console.log(err?.response?.data?.errors || err);
      throw new Error("Failed to get credentials");
    }
  }

  /**
   * This function retrieves a credential by its ID using GraphQL queries and returns it as a Promise.
   * @param {string} id - The `id` parameter is a string representing the unique identifier of a
   * credential. The function `getCredentialById` retrieves the credential information associated with
   * the given `id`.
   * @returns This function returns a Promise that resolves to a Record<string, any> object
   * representing a credential with the specified ID.
   */
  async getCredentialById(id: string): Promise<Record<string, any>> {
    try {
      const query = `
      query($id: String!) {
        credential(id: $id) {
          id
          title
          description
          claim
          tags
          dataModel {
            id
          }
          issuerUser {
            id
            gatewayId
            primaryWallet {
              address
            }
          }
          issuerOrganization {
            id
            gatewayId
          }
          recipientUser {
            id
            gatewayId
            primaryWallet {
              address
            }
          }
          txHash
          nft {
            chain
            minted
            txHash
          }
        }
      }
      `;

      const data = {
        query,
        variables: {
          id,
        },
      };

      const res = await this.api({
        data,
        headers: {
          Authorization: `Bearer ${this.jwt}`,
        },
      });

      if (res.data.errors) throw new Error(JSON.stringify(res.data.errors));

      return res.data.data.credential;
    } catch (err) {
      console.log(err?.response?.data?.errors || err);
      throw new Error(`Failed to get credentials. ProtocolId: ${id}`);
    }
  }

  /**
   * This function retrieves earned credentials by gateway ID and data model ID using GraphQL queries.
   * @param {string} gatewayId - The ID of the gateway for which to retrieve earned credentials.
   * @param {string} dataModelId - The ID of the data model for which to retrieve earned credentials.
   * @returns This function returns a Promise that resolves to a Record<string, any> object, which
   * represents the earned credentials for a given gateway and data model.
   */
  async earnedCredentialsByGatewayIdByDataModel(
    gatewayId: string,
    dataModelId: string
  ): Promise<Record<string, any>> {
    try {
      const query = `
      query($dataModelId: String!, $gatewayId: String!) {
        earnedCredentialsByGatewayIdByDataModel(dataModelId: $dataModelId, gatewayId: $gatewayId) {
          id
          claim
        }
      }
      `;

      const data = {
        query,
        variables: {
          dataModelId,
          gatewayId,
        },
      };

      const res = await this.api({
        data,
        headers: {
          Authorization: `Bearer ${this.jwt}`,
        },
      });

      if (res.data.errors) throw new Error(JSON.stringify(res.data.errors));

      return res.data.data?.earnedCredentialsByGatewayIdByDataModel;
    } catch (err) {
      console.log(err?.response?.data?.errors || err);
      throw new Error("Failed to get credentials");
    }
  }
  /**
   * This function retrieves earned credentials by gateway ID and data model ID using GraphQL queries.
   * @param {string} id - The ID of the gateway for which to retrieve earned credentials.
   * @param {string} dataModelId - The ID of the data model for which to retrieve earned credentials.
   * @returns This function returns a Promise that resolves to a Record<string, any> object, which
   * represents the earned credentials for a given gateway and data model.
   */
  async earnedCredentialsByIdByDataModels(
    id: string,
    dataModelIds: string[]
  ): Promise<Record<string, any>> {
    try {
      const query = `
      query($dataModelIds: [String!]!, $userId: String!) {
        earnedCredentialsByIdByDataModels(dataModelIds: $dataModelIds, id: $userId) {
          id
          title
          claim
          arweaveInfo
          dataModel {
            id
          }
        }
      }
      `;

      const data = {
        query,
        variables: {
          dataModelIds,
          userId: id,
        },
      };

      const res = await this.api({
        data,
        headers: {
          Authorization: `Bearer ${this.jwt}`,
        },
      });

      if (res.data.errors) throw new Error(JSON.stringify(res.data.errors));

      return res.data.data?.earnedCredentialsByIdByDataModels;
    } catch (err) {
      console.log(err?.response?.data?.errors || err);
      throw new Error("Failed to get credentials");
    }
  }

  /**
   * This is a TypeScript function that retrieves user data based on their wallet address.
   * @param {string} wallet - The `wallet` parameter is a string representing the wallet address of a
   * user. This function retrieves user information from a server based on the provided wallet address.
   * @returns This function returns a Promise that resolves to a Record<string, any> object
   * representing a user's information retrieved by their wallet address.
   */
  async getUserByWallet(wallet: string): Promise<Record<string, any>> {
    try {
      const query = `
      query($wallet: String!) {
        userByWallet(wallet: $wallet) {
          id
          gatewayId
        }
      }
      `;

      const data = {
        query,
        variables: {
          wallet,
        },
      };

      const res = await this.api({
        data,
        headers: {
          Authorization: `Bearer ${this.jwt}`,
        },
      });

      if (res.data.errors) throw new Error(JSON.stringify(res.data.errors));

      return res.data.data.userByWallet;
    } catch (err) {
      console.log(err?.response?.data?.errors || err);
      throw new Error("Failed to get user by wallet");
    }
  }

  async createOrganization({
    name,
    gatewayId,
    description,
    signers,
  }: {
    name: string;
    gatewayId: string;
    description: string;
    signers: string[];
  }): Promise<Record<string, any>> {
    try {
      const query = `
      mutation createOrganization(
        $name: String!
        $gatewayId: String!
        $description: String!
        $signers: [String!]
      ) {
        createOrganization(
          createOrganizationInput: {
            name: $name
            username: $gatewayId
            description: $description
            signers: $signers
            chains: [EVM, SOL]
          }
        ) {
          id
          gatewayId
        }
      }
      `;

      const data = {
        query,
        variables: {
          name,
          gatewayId,
          description,
          signers,
        },
      };

      const res = await this.api({
        data,
        headers: {
          Authorization: `Bearer ${this.jwt}`,
        },
      });

      if (res.data.errors) throw new Error(JSON.stringify(res.data.errors));

      return res.data.data.createOrganization;
    } catch (err) {
      console.log(err?.response?.data?.errors || err);
      throw new Error("Failed to create an organization");
    }
  }
}

export default Gateway;
