type CredentialQueueData = {
  recipient: string;
  title: string;
  description: string;
  claim: any;
  dataModelId: string;
  tags: string[];
  image: string;
  needsDapp?: boolean;
  gateId?: string;
  points?: number;
};

export default CredentialQueueData;
