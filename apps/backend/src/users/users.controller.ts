import { Controller, Get, Post, Body, Param, Query, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { UsersService } from './users.service';

@ApiTags('users')
@Controller('v1/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: '회원 목록 조회' })
  findAll(@Query() query: any) {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '회원 상세 조회' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: '회원 생성' })
  create(@Body() dto: any) {
    return this.usersService.create(dto);
  }

  @Get(':id/organization-tree')
  @ApiOperation({ summary: '조직도 트리 조회' })
  getOrganizationTree(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.getOrganizationTree(id);
  }
}
