use dep::public_kernel_lib::PublicKernelTailCircuitPrivateInputs;
use dep::types::KernelCircuitPublicInputs;

#[recursive]
fn main(input: PublicKernelTailCircuitPrivateInputs) -> pub KernelCircuitPublicInputs {
    input.execute()
}
