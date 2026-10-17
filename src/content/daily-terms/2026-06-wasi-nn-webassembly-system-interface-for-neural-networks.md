---
title: "WASI-NN (WebAssembly System Interface for Neural Networks)"
termSlug: "wasi-nn-webassembly-system-interface-for-neural-networks"
year: 2026
month: 6
monthName: "June"
day: 15
order: 11
source: "2026/june-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2026/june-term.md"
excerpt: "WASI-NN is a standardized API specification that lets WebAssembly (WASM) modules perform neural network inference by offloading the computation to native backends — OpenVINO, ONNX Runtime, TensorFl..."
---
### Definition:

WASI-NN is a standardized API specification that lets WebAssembly (WASM) modules perform neural network inference by offloading the computation to native backends — OpenVINO, ONNX Runtime, TensorFlow Lite, or PyTorch — through a clean, host-provided interface.

Normally, running ML inference inside WASM means either:
❌ Compiling the entire ML framework (hundreds of MB) to WASM — slow and bloated.
❌ Writing manual bindings per platform — fragile and non-portable.

WASI-NN solves this by defining a small, standard set of functions (load, init_execution_context, set_input, compute, get_output) that any WASM module can call, and any WASM runtime (Wasmer, Wasmtime, WAMR) can implement by plugging in a native backend. The WASM module stays small and portable; the heavy lifting happens on the host's GPU/NPU/CPU.

Analogy — The Film Lab 📸

Imagine you're a photographer in the 1990s. Your camera has a tiny film roll (the WASM module). It captures the raw shot (input data) and specs like "develop with Fuji process, print 4×6 glossy." You drop the roll at a film lab (the WASM runtime with WASI-NN). The lab has:

A Fuji machine (OpenVINO backend)
A Kodak machine (ONNX Runtime backend)
A printing press (PyTorch backend)

You don't care which machine does the work — you just hand over the film and a memo ("inference request"). The lab picks the right machine, runs the chemistry, and hands you back the final prints (output tensor). You never set foot in the machine room.

The film roll stays tiny. The lab does the heavy equipment work. That's WASI-NN.

### Example:

Running Image Classification via WASI-NN

```
;; WASM module using WASI-NN to classify an image
;; The module sends bytes → gets back a label index

(module
  ;; Import WASI-NN functions provided by the host runtime
  (import "wasi_nn" "load"
    (func $load (param $bytes i32) (param $len i32)
                (result i32)))        ;; returns graph handle

  (import "wasi_nn" "init_execution_context"
    (func $init_ctx (param $graph i32)
                    (result i32)))    ;; returns context handle

  (import "wasi_nn" "set_input"
    (func $set_input (param $ctx i32) (param $tensor i32))  ;; void

  (import "wasi_nn" "compute"
    (func $compute (param $ctx i32)))                       ;; void

  (import "wasi_nn" "get_output"
    (func $get_output (param $ctx i32) (param $out i32)))   ;; void

  ;; Memory for input image (224×224×3 = 150,528 bytes)
  (memory (export "memory") 1)

  ;; ─── Inference Flow ───
  (func (export "classify") (param $img_offset i32) (param $img_len i32)
                            (result i32)

    ;; Step 1: Load the model from embedded bytes
    ;;        (model stored in WASM data section at offset 0x1000)
    i32.const 0x1000      ;; model bytes start
    i32.const 50000       ;; model size in bytes
    call $load
    local.set $graph      ;; graph handle

    ;; Step 2: Create an execution context
    local.get $graph
    call $init_ctx
    local.set $ctx

    ;; Step 3: Set the input tensor (the image)
    local.get $ctx
    local.get $img_offset
    call $set_input

    ;; Step 4: Run inference
    local.get $ctx
    call $compute

    ;; Step 5: Read the result (index of highest-probability class)
    local.get $ctx
    i32.const 0x2000      ;; write output tensor here
    call $get_output

    ;; Return the top class index
    i32.load 0x2000
  )
)
```
