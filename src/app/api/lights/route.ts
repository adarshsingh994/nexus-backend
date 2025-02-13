import { NextRequest, NextResponse } from 'next/server'
import { ChildProcess, spawn } from 'child_process'
import http from 'http'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

let bulbs : string[] = []
let pythonProcesses: ChildProcess[] = []
let lightServiceInterval: NodeJS.Timeout | null = null

// Function to call the lights API
function callLightsApi() {
  const options = {
    hostname: '192.168.18.4',
    port: 3000,
    path: '/api/lights',
    method: 'GET'
  }

  const req = http.request(options, (res) => {
    let data = ''
    res.on('data', (chunk) => {
      data += chunk
    })
    res.on('end', () => {
      console.log('Scheduled lights API call completed:', data)
    })
  })

  req.on('error', (error) => {
    console.error('Error in scheduled lights API call:', error)
  })

  req.end()
}

// Start the lights service
if (!lightServiceInterval) {
  lightServiceInterval = setInterval(callLightsApi, 2 * 60 * 1000) // 2 minutes in milliseconds
  console.log('Lights service started - will call API every 30 minutes')
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(req: NextRequest) {
  try {
    const action = req.nextUrl.searchParams.get('action')
    const color = req.nextUrl.searchParams.get('color')?.split(',').map(Number)
    const intensity = Number(req.nextUrl.searchParams.get('intensity'))

    console.log('Action received')
    console.log(`>>${action}<<`)
    console.log(`Bulb ips: ${bulbs}`)

    if(action === 'on') {
      console.log('Turning on lights')
      const turnLightsOnResponse = await callPythonFile('turn_on_lights', bulbs)
      const turnOnLightsData = JSON.parse(turnLightsOnResponse)
      
      console.log('Light operation results:', JSON.stringify(turnOnLightsData, null, 2))
      
      const responseStatus = turnOnLightsData.overall_success ? 200 : 207 // 207 Multi-Status for partial success
      
      return NextResponse.json(
        { 
          message: turnOnLightsData.overall_success ? "All lights turned on successfully" : "Some lights failed to turn on",
          overall_success: turnOnLightsData.overall_success,
          results: turnOnLightsData.results
        },
        { 
          status: responseStatus,
          headers: corsHeaders
        }
      )
    } else if(action === 'off') {
      console.log('Turning off lights')
      const turnLightsOffResponse = await callPythonFile('turn_off_lights', bulbs)
      const turnOffLightsData = JSON.parse(turnLightsOffResponse)
      
      console.log('Light operation results:', JSON.stringify(turnOffLightsData, null, 2))
      
      const responseStatus = turnOffLightsData.overall_success ? 200 : 207 // 207 Multi-Status for partial success
      
      return NextResponse.json(
        { 
          message: turnOffLightsData.overall_success ? "All lights turned off successfully" : "Some lights failed to turn off",
          overall_success: turnOffLightsData.overall_success,
          results: turnOffLightsData.results
        },
        { 
          status: responseStatus,
          headers: corsHeaders
        }
      )
    } else if(action === 'warm_white') {
      console.log(`Setting light warm white: >>${intensity}<<`)
      const request = {
        ips: bulbs,
        intensity: intensity
      }
      const setLightsWarmWhiteResponse = await callPythonFile('set_lights_warm_white', [JSON.stringify(request)])
      const setLightsWarmWhiteData = JSON.parse(setLightsWarmWhiteResponse)
      
      console.log('Light operation results:', JSON.stringify(setLightsWarmWhiteData, null, 2))
      
      const responseStatus = setLightsWarmWhiteData.overall_success ? 200 : 207 // 207 Multi-Status for partial success
      
      return NextResponse.json(
        { 
          message: setLightsWarmWhiteData.overall_success 
            ? `All lights set to warm white with intensity ${intensity} successfully` 
            : "Some lights failed to set warm white",
          overall_success: setLightsWarmWhiteData.overall_success,
          results: setLightsWarmWhiteData.results
        },
        { 
          status: responseStatus,
          headers: corsHeaders
        }
      )
    } else if(action === 'cold_white') {
      console.log(`Setting light cold white: >>${intensity}<<`)
      const request = {
        ips: bulbs,
        intensity: intensity
      }
      const setLightsColdWhiteResponse = await callPythonFile('set_lights_cold_white', [JSON.stringify(request)])
      const setLightsColdWhiteData = JSON.parse(setLightsColdWhiteResponse)
      
      console.log('Light operation results:', JSON.stringify(setLightsColdWhiteData, null, 2))
      
      const responseStatus = setLightsColdWhiteData.overall_success ? 200 : 207 // 207 Multi-Status for partial success
      
      return NextResponse.json(
        { 
          message: setLightsColdWhiteData.overall_success 
            ? `All lights set to cold white with intensity ${intensity} successfully` 
            : "Some lights failed to set cold white",
          overall_success: setLightsColdWhiteData.overall_success,
          results: setLightsColdWhiteData.results
        },
        { 
          status: responseStatus,
          headers: corsHeaders
        }
      )
    } else if(action === 'color') {
      console.log(`Changing light color: >>${color}<<`)
      const request = {
        ips: bulbs,
        color: color
      }
      const changeLightColorResponse = await callPythonFile('set_lights_color', [JSON.stringify(request)])
      const changeLightColorData = JSON.parse(changeLightColorResponse)
      
      console.log('Light operation results:', JSON.stringify(changeLightColorData, null, 2))
      
      const responseStatus = changeLightColorData.overall_success ? 200 : 207 // 207 Multi-Status for partial success
      
      return NextResponse.json(
        { 
          message: changeLightColorData.overall_success 
            ? `All lights set to RGB color (${color?.join(', ')}) successfully` 
            : "Some lights failed to set color",
          overall_success: changeLightColorData.overall_success,
          results: changeLightColorData.results
        },
        { 
          status: responseStatus,
          headers: corsHeaders
        }
      )
    } else {
      console.log('Getting all the lights in the network')
      const getLightsResponse = await callPythonFile('get_lights')
      const getLightsData = JSON.parse(getLightsResponse)
      
      console.log('Light discovery results:', JSON.stringify(getLightsData, null, 2))
      
      bulbs = getLightsData.bulbs
      console.log(`Bulbs ${bulbs} saved`)
      
      return NextResponse.json(
        { 
          message: getLightsData.message,
          success: getLightsData.success,
          data: {
            count: getLightsData.count,
            bulbs: getLightsData.bulbs
          }
        },
        { 
          status: getLightsData.success ? 200 : 404,
          headers: corsHeaders
        }
      )
    }
  } catch (error) {
      console.error("Error:", error)
      return NextResponse.json(
        { message: error },
        { 
          status: 500,
          headers: corsHeaders
        }
      )
  }
}

export async function POST() {
  return NextResponse.json(
    { message: 'This is a post request' },
    { 
      status: 200,
      headers: corsHeaders
    }
  );
}

export async function PATCH() {
  return NextResponse.json(
    { message: 'This is a patch request' },
    { 
      status: 200,
      headers: corsHeaders
    }
  );
}

function callPythonFile(name: string, args: string[] = []): Promise<string> {
  return new Promise((resolve, reject) => {
    const venvPythonPath = 'python_scripts/.venv/Scripts/python.exe'; // Windows
    // const venvPythonPath = 'python_scripts/.venv/bin/python'; // macOS/Linux

    const scriptPath = `python_scripts/${name}.py`;
    const scriptArgs = [scriptPath, ...args.map(arg => String(arg))];

    console.log(`Executing: ${venvPythonPath} ${scriptArgs.join(' ')}`);

    const pythonProcess = spawn(venvPythonPath, scriptArgs, { stdio: ['ignore', 'pipe', 'pipe'] });
    
    pythonProcesses.push(pythonProcess); // Track running processes

    let output = "";
    let error = "";

    pythonProcess.stdout.on("data", (data) => {
      output += data.toString();
    });

    pythonProcess.stderr.on("data", (data) => {
      error += data.toString();
    });

    pythonProcess.on("close", (code) => {
      pythonProcesses = pythonProcesses.filter(p => p !== pythonProcess); // Remove from list
      if (code === 0) {
        resolve(output.trim());
      } else {
        reject(new Error(`Python script exited with code ${code}: ${error.trim()}`));
      }
    });
  });
}

// Clean up processes when the server stops
process.on("SIGINT", () => {
  console.log("Server shutting down, terminating Python processes...");
  if (lightServiceInterval) {
    clearInterval(lightServiceInterval);
    console.log("Lights service stopped");
  }
  pythonProcesses.forEach(p => p.kill());
  process.exit();
});

process.on("SIGTERM", () => {
  console.log("Server shutting down, terminating Python processes...");
  if (lightServiceInterval) {
    clearInterval(lightServiceInterval);
    console.log("Lights service stopped");
  }
  pythonProcesses.forEach(p => p.kill());
  process.exit();
});
