import { IsPhoneNumber, IsString } from 'class-validator';

export class PhoneLoginDto {
  @IsPhoneNumber('PK')
  phoneNumber: string;

  @IsString()
  password: string;
}
