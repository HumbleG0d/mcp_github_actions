import { writeFile, mkdir, access } from 'fs/promises';
import path from "path"
import os from 'os'
import { constants} from "fs"
import { DownloadResult } from '@/types/types';
import JSZip from 'jszip'

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

        const filename = `log_${id}`
        const downloadPath = path.join(os.homedir() , 'Downloads')
        
        //Verificamos si existe la carpeta downloads , sino la creamos
        try {
            await access(downloadPath , constants.F_OK)
        } catch (error) {
            await mkdir(downloadPath , {recursive: true})
        }

        const fullPath = path.join(downloadPath, filename)

        //Proceso de descomprimir 
        try {
            const zip = await JSZip.loadAsync(buffer)
            await mkdir(fullPath , {recursive: true})
    
            const promises: Promise<void>[] = []
            zip.forEach((relativePath , file) => {
                if(!file.dir) {
                    const promise = (async () => {
                        const content = await file.async('nodebuffer')
                        const filePath = path.join(fullPath! , relativePath)
                        await mkdir(path.dirname(filePath) , {recursive: true})
                        await writeFile(filePath , content)
                    })();
                    promises.push(promise)
                }
            })
    
            await Promise.all(promises)
            console.log(`Unzip succes: ${fullPath}`);
    
        } catch (error) {
            if(error instanceof Error){
                throw new Error(`Error : ${error.message}`)
            }
            throw new Error('Unknown error when unzip')
        }

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