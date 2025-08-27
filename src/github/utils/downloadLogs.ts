import { writeFile, mkdir, access, readdir } from 'fs/promises';
import path from "path"
import os from 'os'
import { constants , readFileSync} from "fs"
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

        const dirname = `log_${id}`
        const downloadPath = path.join(os.homedir() , 'Downloads')
        
        //Verificamos si existe la carpeta downloads , sino la creamos
        try {
            await access(downloadPath , constants.F_OK)
        } catch (error) {
            await mkdir(downloadPath , {recursive: true})
        }

        const fullPath = path.join(downloadPath, dirname)

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


export const readMultiplesFile = async (filename: string) : Promise<{ [path: string]: string }> => {
    //Hacer una busqueda de los archivos ah leer
    const downloadPath = path.join(os.homedir() , 'Downloads')
    
    const fullPath = path.join(downloadPath , filename)
    
    const fileNames = await readdir(fullPath) //Obtengo los nombres de los archivos

    const filePaths = fileNames.map(file => {
        return path.join(fullPath , file)
    })

    const promises = filePaths.map(async (path) => {
        try {
            const content = await readTexFile(path)
            return {
                path , content
            }
        } catch (error) {
            console.warn(`Failed to read ${path}:`, error);
            return { path, content: '' };
        }
    })  

    const results = await Promise.all(promises)
    return results.reduce((acc, { path, content }) => {
        acc[path] = content;
        return acc;
    }, {} as { [path: string]: string });
}

async function readTexFile(filePath: string) : Promise<string> {
    try {
        const content = readFileSync(filePath , 'utf8')
        return content
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Error reading file '${filePath}': ${error.message}`);
        }
        throw new Error(`Unknown error reading file '${filePath}'`);
    }
}
