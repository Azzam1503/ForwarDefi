import { IsNotEmpty, IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateWalletAddressDto {
  @ApiProperty({
    description: 'User wallet address (Ethereum/Avalanche format)',
    example: '0x1234567890123456789012345678901234567890',
    pattern: '^0x[a-fA-F0-9]{40}$',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^0x[a-fA-F0-9]{40}$/, {
    message: 'Wallet address must be a valid Ethereum/Avalanche address (0x followed by 40 hex characters)',
  })
  readonly wallet_address: string;
}
