import { parse } from 'csv-parse';
import * as fs from 'fs';
import * as path from 'path';

/**
 * 解析CSV文件并返回解析后的数据
 * @param filePath CSV文件路径
 * @returns 解析后的数据数组
 */
export async function parseCSVFile(filePath: string): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const results: any[] = [];

    fs.createReadStream(filePath)
      .pipe(
        parse({
          columns: true, // 使用第一行作为列名
          delimiter: ',', // 使用逗号作为分隔符
          skip_empty_lines: true, // 跳过空行
        }),
      )
      .on('data', (data) => results.push(data))
      .on('error', (error) => reject(error))
      .on('end', () => resolve(results));
  });
}

/**
 * 统计CSV数据中指定字段的值出现次数
 * @param data CSV解析后的数据
 * @param fieldName 要统计的字段名
 * @returns 包含每个值及其出现次数的对象
 */
export function countFieldValues(
  data: any[],
  fieldName: string,
): Record<string, number> {
  const counts: Record<string, number> = {};

  return counts;
}

/**
 * 示例使用函数：解析CSV文件并统计指定字段的值
 * @param filePath CSV文件路径
 * @param fieldName 要统计的字段名
 */
export async function analyzeCSVField(
  filePath: string,
  fieldName: string,
): Promise<void> {
  try {
    console.log(`file: ${path.basename(filePath)}`);
    const data = await parseCSVFile(filePath);

    console.log(`total: ${data.length}`);
    let con1 = 0;

    data.forEach((row, idx) => {
      const value = row[fieldName];
      if (typeof value === 'string' && value.length > 6) {
        con1++;
      } else {
        console.log(`null row ${idx}: ${JSON.stringify(row)}`);
      }
    });
    console.log(`field "${fieldName}" not-null-cont: ${con1}`);
  } catch (error) {
    console.error('解析CSV文件时发生错误:', error);
  }
}

// 使用示例
if (require.main === module) {
  // 如果直接运行此文件，执行示例分析
  // 用法: ts-node csv.ts <文件路径> <字段名>
  const file = 'user_tiers_2025-06-11-15-36-19.csv';
  const fp = path.join(__dirname, file);
  analyzeCSVField(fp, 'resourceId');
}
