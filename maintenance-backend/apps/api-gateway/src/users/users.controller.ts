import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import {
  CreateUserDto,
  UpdateUserDto,
  InviteEmployeeDto,
  AcceptInvitationDto,
} from './dto';
import { JwtAuthGuard, PermissionsGuard } from '@app/common/guards';
import { Permissions, Public, CurrentUser } from '@app/common/decorators';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('users:create')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new user (admin only)' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  async create(@Body() createUserDto: CreateUserDto) {
    const user = await this.usersService.create(createUserDto);
    return {
      success: true,
      message: 'User created successfully',
      data: user,
    };
  }

  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('users:view')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all users' })
  @ApiQuery({ name: 'companyId', required: false, description: 'Filter by company ID' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  async findAll(@Query('companyId') companyId?: string) {
    const users = await this.usersService.findAll(companyId);
    return {
      success: true,
      data: users,
    };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('users:view')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a user by ID' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findOne(@Param('id') id: string) {
    const user = await this.usersService.findOne(id);
    return {
      success: true,
      data: user,
    };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('users:edit')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a user' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    const user = await this.usersService.update(id, updateUserDto);
    return {
      success: true,
      message: 'User updated successfully',
      data: user,
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('users:delete')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a user' })
  @ApiResponse({ status: 204, description: 'User deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async remove(@Param('id') id: string) {
    await this.usersService.remove(id);
  }

  // ============= EMPLOYEE INVITATION ENDPOINTS =============

  @Post('invite')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('users:create')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Invite employee to join company' })
  @ApiResponse({ status: 201, description: 'Invitation sent successfully' })
  @ApiResponse({ status: 400, description: 'Email validation failed' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  async inviteEmployee(
    @Body() inviteDto: InviteEmployeeDto,
    @CurrentUser('companyId') companyId: string,
    @CurrentUser('userId') invitedBy: string,
  ) {
    const user = await this.usersService.inviteEmployee(companyId, inviteDto, invitedBy);
    return {
      success: true,
      message: 'Employee invitation sent successfully. They will receive an email with instructions.',
      data: user,
    };
  }

  @Post('accept-invitation')
  @Public()
  @ApiOperation({ summary: 'Accept employee invitation and set password (public endpoint)' })
  @ApiResponse({ status: 200, description: 'Invitation accepted successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired invitation token' })
  async acceptInvitation(@Body() acceptDto: AcceptInvitationDto) {
    const user = await this.usersService.acceptInvitation(acceptDto);
    return {
      success: true,
      message: 'Invitation accepted successfully. You can now login with your credentials.',
      data: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    };
  }

  @Post(':id/resend-invitation')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('users:create')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend invitation email' })
  @ApiResponse({ status: 200, description: 'Invitation resent successfully' })
  @ApiResponse({ status: 400, description: 'Invitation already accepted or invalid' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async resendInvitation(@Param('id') userId: string) {
    await this.usersService.resendInvitation(userId);
    return {
      success: true,
      message: 'Invitation email resent successfully',
    };
  }

  @Delete(':id/invitation')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('users:delete')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Cancel pending invitation' })
  @ApiResponse({ status: 204, description: 'Invitation cancelled successfully' })
  @ApiResponse({ status: 400, description: 'Invitation already accepted or invalid' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async cancelInvitation(@Param('id') userId: string) {
    await this.usersService.cancelInvitation(userId);
  }

  @Get('company/:companyId/pending-invitations')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('users:view')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get pending invitations for a company' })
  @ApiResponse({ status: 200, description: 'Pending invitations retrieved successfully' })
  async getPendingInvitations(@Param('companyId') companyId: string) {
    const invitations = await this.usersService.getPendingInvitations(companyId);
    return {
      success: true,
      data: invitations,
    };
  }
}
