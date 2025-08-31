import { IsEthereumAddress, IsNumberString } from 'class-validator';

export class TokenBalanceDto {
  @IsEthereumAddress()
  address: string;
}

export class TokenMintDto {
  @IsEthereumAddress()
  to: string;

  @IsNumberString()
  amount: string;
}

export class TokenApprovalDto {
  @IsEthereumAddress()
  owner: string;

  @IsEthereumAddress()
  spender: string;

  @IsNumberString()
  amount: string;
}

export class CheckAllowanceDto {
  @IsEthereumAddress()
  owner: string;

  @IsEthereumAddress()
  spender: string;
}
