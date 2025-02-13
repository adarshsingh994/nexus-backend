import { NextRequest, NextResponse } from 'next/server'
import { ChildProcess, spawn } from 'child_process'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

let bulbs : string[] = []
let pythonProcesses: ChildProcess[] = []

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
      const success = turnOnLightsData.success

      console.log(`Status: ${success}`)

      return NextResponse.json(
        { message: "success" },
        { 
          status: 200,
          headers: corsHeaders
        }
      )
    } else if(action === 'off') {
      console.log('Turning off lights')
      const turnLightsOffResponse = await callPythonFile('turn_off_lights', bulbs)
      console.log(turnLightsOffResponse)
      const turnOffLightsData = JSON.parse(turnLightsOffResponse)
      const success = turnOffLightsData.success

      console.log(`Status: ${success}`)

      return NextResponse.json(
        { message: "success" },
        { 
          status: 200,
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
      console.log(setLightsWarmWhiteResponse)
      const setLightsWarmWhiteData = JSON.parse(setLightsWarmWhiteResponse)
      const success = setLightsWarmWhiteData.success

      console.log(`Status: ${success}`)

      return NextResponse.json(
        { message: "success" },
        { 
          status: 200,
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
      console.log(setLightsColdWhiteResponse)
      const setLightsColdWhiteData = JSON.parse(setLightsColdWhiteResponse)
      const success = setLightsColdWhiteData.success

      console.log(`Status: ${success}`)

      return NextResponse.json(
        { message: "success" },
        { 
          status: 200,
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
      console.log(changeLightColorResponse)
      const changeLightColorData = JSON.parse(changeLightColorResponse)
      const success = changeLightColorData.success

      console.log(`Status: ${success}`)

      return NextResponse.json(
        { message: "success" },
        { 
          status: 200,
          headers: corsHeaders
        }
      )
    } else {
      console.log('Gettinig all the lights in the network')
      const getLightsResponse = await callPythonFile('get_lights')
      const getLightsData = JSON.parse(getLightsResponse)
      bulbs = getLightsData.bulbs
      console.log(`Bulbs ${bulbs} saved`)
      return NextResponse.json(
        { 
          message: 'Success',
          data: {
            bulbs: bulbs
          }
        },
        { 
          status: 200,
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

// Kill Python processes when the server stops
process.on("SIGINT", () => {
  console.log("Server shutting down, terminating Python processes...");
  pythonProcesses.forEach(p => p.kill());
  process.exit();
});

process.on("SIGTERM", () => {
  console.log("Server shutting down, terminating Python processes...");
  pythonProcesses.forEach(p => p.kill());
  process.exit();
});








