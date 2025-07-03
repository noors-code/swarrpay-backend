import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
  Put,
  Query,
  ParseUUIDPipe,
  ParseIntPipe,
  ParseBoolPipe,
} from '@nestjs/common';
import { WalletService } from './wallet.service';
import { JwtAuthGuard } from '../users/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UpdateSecuritySettingsDto, VerifyTransactionPINDto } from './dto/security-settings.dto';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { UpdateWalletDto } from './dto/update-wallet.dto';
import { SendTransactionDto, GetTransactionsQueryDto, TransactionResponseDto } from './dto/transaction.dto';
import { WalletResponseDto, CreateWalletResponseDto } from './dto/wallet-response.dto';

@ApiTags('wallet')
@Controller('wallet')
@UseGuards(JwtAuthGuard)
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new wallet' })
  @ApiResponse({ status: 201, type: CreateWalletResponseDto })
  async createWallet(
    @Req() req: any,
    @Body() createWalletDto: CreateWalletDto,
  ): Promise<CreateWalletResponseDto> {
    return this.walletService.createWallet(req.user.id, createWalletDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all wallets for the authenticated user' })
  @ApiResponse({ status: 200, type: [WalletResponseDto] })
  async getUserWallets(@Req() req: any): Promise<WalletResponseDto[]> {
    return this.walletService.getUserWallets(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific wallet' })
  @ApiResponse({ status: 200, type: WalletResponseDto })
  async getWallet(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: any,
  ): Promise<WalletResponseDto> {
    return this.walletService.getWallet(id, req.user.id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a wallet' })
  @ApiResponse({ status: 200, type: WalletResponseDto })
  async updateWallet(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: any,
    @Body() updateWalletDto: UpdateWalletDto,
  ): Promise<WalletResponseDto> {
    return this.walletService.updateWallet(id, req.user.id, updateWalletDto);
  }

  @Get(':id/balance')
  @ApiOperation({ summary: 'Get wallet balance' })
  @ApiResponse({ status: 200, type: Number })
  async getWalletBalance(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: any,
  ): Promise<number> {
    const wallet = await this.walletService.getWallet(id, req.user.id);
    return this.walletService.getWalletBalance(wallet.publicKey);
  }

  @Post(':id/transaction')
  @ApiOperation({ summary: 'Send a transaction' })
  async sendTransaction(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: any,
    @Body() sendTransactionDto: SendTransactionDto,
  ) {
    return this.walletService.sendTransaction(id, req.user.id, sendTransactionDto);
  }

  @Get(':id/transactions')
  @ApiOperation({ summary: 'Get transaction history' })
  async getTransactions(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('offset', new ParseIntPipe({ optional: true })) offset?: number,
  ) {
    return this.walletService.getTransactionHistory(
      id,
      req.user.id,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
      limit,
      offset,
    );
  }

  @Post(':id/sync')
  @ApiOperation({ summary: 'Sync wallet transactions' })
  async syncTransactions(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: any,
  ): Promise<void> {
    return this.walletService.syncTransactions(id, req.user.id);
  }

  @Put(':id/security')
  @ApiOperation({ summary: 'Update wallet security settings' })
  async updateSecuritySettings(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: any,
    @Body() settings: UpdateSecuritySettingsDto,
  ) {
    return this.walletService.updateSecuritySettings(id, req.user.id, settings);
  }

  @Post(':id/verify-pin')
  @ApiOperation({ summary: 'Verify transaction PIN' })
  async verifyTransactionPIN(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: any,
    @Body('pin') pin: string,
  ): Promise<boolean> {
    return this.walletService.verifyTransactionPIN(id, req.user.id, pin);
  }

  @Get(':id/check-limit')
  @ApiOperation({ summary: 'Check if transaction amount is within daily limit' })
  async checkTransactionLimit(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: any,
    @Query('amount', ParseIntPipe) amount: number,
  ): Promise<boolean> {
    return this.walletService.checkDailyTransactionLimit(id, req.user.id, amount);
  }

  @Get(':id/check-address')
  @ApiOperation({ summary: 'Check if address is in allowed list' })
  async checkAllowedAddress(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: any,
    @Query('address') address: string,
  ): Promise<boolean> {
    return this.walletService.verifyAllowedAddress(id, req.user.id, address);
  }

  @Post(':id/send-confirmation')
  @ApiOperation({ summary: 'Send transaction confirmation email' })
  async sendTransactionConfirmation(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: any,
    @Body() transactionDetails: {
      amount: number;
      toAddress: string;
      memo?: string;
    },
  ): Promise<void> {
    return this.walletService.sendTransactionConfirmationEmail(
      id,
      req.user.id,
      transactionDetails,
    );
  }
} 