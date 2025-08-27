import { writeFile, mkdir, access } from 'fs/promises';
import path from "path"
import os from 'os'
import { constants} from "fs"
import { DownloadResult } from '@/types/types';

export const downloadLogs = async (id: number , response: Response ) : Promise<DownloadResult> => {
    try {
        // Verificar que la respuesta tenga contenido
        if (!response.body) {
            return {
                success: false,
                error: 'Response body is empty'
            }
        }

        const buffer = Buffer.from( await response.arrayBuffer())
        
        // Verificar que el buffer no esté vacío
        if (buffer.length === 0) {
            return {
                success: false,
                error: 'No log data received from GitHub API'
            }
        }

        const filename = `log_${id}.zip`
        const downloadPath = path.join(os.homedir() , 'Downloads')
        
        //Verificamos si existe la carpeta downloads , sino la creamos
        try {
            await access(downloadPath , constants.F_OK)
        } catch (error) {
            await mkdir(downloadPath , {recursive: true})
        }

        const fullPath = path.join(downloadPath, filename)

        await writeFile(fullPath , buffer)
        
        return {
            success: true,
            filename: fullPath
        }
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error getting file logs'
        }
    }
}