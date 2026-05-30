import { IsArray, IsString, ArrayMinSize, IsOptional } from 'class-validator';

export class CreateExecutionDto {
  @IsString()
  projectId: string;

  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  testTypes: string[];

  @IsOptional()
  @IsString()
  customPrompt?: string;
}
