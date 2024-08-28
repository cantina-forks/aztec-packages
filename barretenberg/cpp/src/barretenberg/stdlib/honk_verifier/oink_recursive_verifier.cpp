#include "barretenberg/stdlib/honk_verifier/oink_recursive_verifier.hpp"

#include "barretenberg/numeric/bitop/get_msb.hpp"
#include "barretenberg/plonk_honk_shared/library/grand_product_delta.hpp"
#include "barretenberg/transcript/transcript.hpp"
#include <utility>

namespace bb::stdlib::recursion::honk {

template <typename Flavor>
OinkRecursiveVerifier_<Flavor>::OinkRecursiveVerifier_(Builder* builder,
                                                       const std::shared_ptr<Instance>& instance,
                                                       std::shared_ptr<Transcript> transcript,
                                                       std::string domain_separator)
    : instance(instance)
    , builder(builder)
    , transcript(transcript)
    , domain_separator(std::move(domain_separator))
{}

template <typename Flavor>
OinkRecursiveVerifier_<Flavor>::OinkRecursiveVerifier_(Builder* builder,
                                                       const std::shared_ptr<Instance>& instance,
                                                       std::string domain_separator)
    : instance(instance)
    , builder(builder)
    , domain_separator(std::move(domain_separator))
{}

template <typename Flavor> void OinkRecursiveVerifier_<Flavor>::verify_proof(OinkProof& proof)
{
    transcript = std::make_shared<Transcript>(proof);
    verify();
}

template <typename Flavor> void OinkRecursiveVerifier_<Flavor>::verify()
{
    using CommitmentLabels = typename Flavor::CommitmentLabels;

    WitnessCommitments commitments;
    CommitmentLabels labels;

    // CALCULATED SIZE OF HASH BUFFER = 0
    FF circuit_size = transcript->template receive_from_prover<FF>(domain_separator + "circuit_size");
    transcript->template receive_from_prover<FF>(domain_separator + "public_input_size");
    transcript->template receive_from_prover<FF>(domain_separator + "pub_inputs_offset");
    // CALCULATED SIZE OF HASH BUFFER = 3

    // TODO(https://github.com/AztecProtocol/barretenberg/issues/1032): Uncomment these once it doesn't cause issues
    // with the flows
    // ASSERT(static_cast<uint32_t>(circuit_size.get_value()) == key->circuit_size);
    // ASSERT(static_cast<uint32_t>(public_input_size.get_value()) == key->num_public_inputs);
    // ASSERT(static_cast<uint32_t>(pub_inputs_offset.get_value()) == key->pub_inputs_offset);

    info("Num gates before oink PI instantiation:   ", builder->num_gates);
    info("Num public inputs:   ", instance->verification_key->num_public_inputs);
    std::vector<FF> public_inputs;

    for (size_t i = 0; i < instance->verification_key->num_public_inputs; ++i) {
        public_inputs.emplace_back(
            transcript->template receive_from_prover<FF>(domain_separator + "public_input_" + std::to_string(i)));
    }
    info("Num gates after oink PI instantiation:    ", builder->num_gates);
    // CALCULATED SIZE OF HASH BUFFER = 6

    // Get commitments to first three wire polynomials
    commitments.w_l = transcript->template receive_from_prover<Commitment>(domain_separator + labels.w_l);
    commitments.w_r = transcript->template receive_from_prover<Commitment>(domain_separator + labels.w_r);
    commitments.w_o = transcript->template receive_from_prover<Commitment>(domain_separator + labels.w_o);
    // CALCULATED SIZE OF HASH BUFFER = 12

    // If Goblin, get commitments to ECC op wire polynomials and DataBus columns
    if constexpr (IsGoblinFlavor<Flavor>) {
        // Receive ECC op wire commitments
        for (auto [commitment, label] : zip_view(commitments.get_ecc_op_wires(), labels.get_ecc_op_wires())) {
            commitment = transcript->template receive_from_prover<Commitment>(domain_separator + label);
        }
        // CALCULATED SIZE OF HASH BUFFER = 20

        // Receive DataBus related polynomial commitments
        // NUM COMMITMENTS: 9
        for (auto [commitment, label] : zip_view(commitments.get_databus_entities(), labels.get_databus_entities())) {
            commitment = transcript->template receive_from_prover<Commitment>(domain_separator + label);
        }
        // CALCULATED SIZE OF HASH BUFFER = 38
        // But we're actually hashing 70 things
    }

    info("Num gates before generating etas:         ", builder->num_gates);
    // if constexpr (IsMegaBuilder<Builder>) {
    //     builder->blocks.summarize();
    // }
    // Get eta challenges; used in RAM/ROM memory records and log derivative lookup argument
    auto [eta, eta_two, eta_three] = transcript->template get_challenges<FF>(
        domain_separator + "eta", domain_separator + "eta_two", domain_separator + "eta_three");
    info("Num gates after generating etas:          ", builder->num_gates);
    // if constexpr (IsMegaBuilder<Builder>) {
    //     builder->blocks.summarize();
    // }

    // Get commitments to lookup argument polynomials and fourth wire
    commitments.lookup_read_counts =
        transcript->template receive_from_prover<Commitment>(domain_separator + labels.lookup_read_counts);
    commitments.lookup_read_tags =
        transcript->template receive_from_prover<Commitment>(domain_separator + labels.lookup_read_tags);
    commitments.w_4 = transcript->template receive_from_prover<Commitment>(domain_separator + labels.w_4);

    info("Num gates after oink commitment creation: ", builder->num_gates);
    // Get permutation challenges
    auto [beta, gamma] = transcript->template get_challenges<FF>(domain_separator + "beta", domain_separator + "gamma");
    info("Num gates after creating beta and gamma:  ", builder->num_gates);

    commitments.lookup_inverses =
        transcript->template receive_from_prover<Commitment>(domain_separator + labels.lookup_inverses);

    // If Goblin (i.e. using DataBus) receive commitments to log-deriv inverses polynomials
    if constexpr (IsGoblinFlavor<Flavor>) {
        for (auto [commitment, label] : zip_view(commitments.get_databus_inverses(), labels.get_databus_inverses())) {
            commitment = transcript->template receive_from_prover<Commitment>(domain_separator + label);
        }
    }

    info("Num gates before PI delta:                ", builder->num_gates);
    const FF public_input_delta = compute_public_input_delta<Flavor>(
        public_inputs, beta, gamma, circuit_size, static_cast<uint32_t>(instance->verification_key->pub_inputs_offset));
    info("Num gates after PI delta:                 ", builder->num_gates);

    // Get commitment to permutation and lookup grand products
    commitments.z_perm = transcript->template receive_from_prover<Commitment>(domain_separator + labels.z_perm);

    RelationSeparator alphas;
    for (size_t idx = 0; idx < alphas.size(); idx++) {
        alphas[idx] = transcript->template get_challenge<FF>(domain_separator + "alpha_" + std::to_string(idx));
    }
    info("Num gates after receiving Z_perm and making ", alphas.size(), " alpha challenges:", builder->num_gates);

    instance->relation_parameters = RelationParameters<FF>{ eta, eta_two, eta_three, beta, gamma, public_input_delta };
    instance->witness_commitments = std::move(commitments);
    instance->public_inputs = std::move(public_inputs);
    instance->alphas = std::move(alphas);
}

template class OinkRecursiveVerifier_<bb::UltraRecursiveFlavor_<UltraCircuitBuilder>>;
template class OinkRecursiveVerifier_<bb::UltraRecursiveFlavor_<MegaCircuitBuilder>>;
template class OinkRecursiveVerifier_<bb::MegaRecursiveFlavor_<UltraCircuitBuilder>>;
template class OinkRecursiveVerifier_<bb::MegaRecursiveFlavor_<MegaCircuitBuilder>>;
template class OinkRecursiveVerifier_<bb::UltraRecursiveFlavor_<CircuitSimulatorBN254>>;
template class OinkRecursiveVerifier_<bb::MegaRecursiveFlavor_<CircuitSimulatorBN254>>;
} // namespace bb::stdlib::recursion::honk
