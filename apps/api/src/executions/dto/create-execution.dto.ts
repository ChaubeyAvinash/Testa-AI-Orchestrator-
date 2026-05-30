import { IsArray, IsString, ArrayMinSize } from 'class-validator';

export class CreateExecutionDto {
  @IsString()
  projectId: string;

  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  testTypes: string[];
}
