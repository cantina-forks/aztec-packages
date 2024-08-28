#include "barretenberg/transcript/tag.hpp"
#include "barretenberg/common/throw_or_abort.hpp"
#include "barretenberg/numeric/uint256/uint256.hpp"

namespace bb {
using namespace numeric;
void check_child_tags(const uint256_t& tag_a, const uint256_t& tag_b)
{
    const uint128_t* challenges_a = (const uint128_t*)(&tag_a.data[2]);
    const uint128_t* challenges_b = (const uint128_t*)(&tag_b.data[2]);

    const uint128_t* submitted_a = (const uint128_t*)(&tag_a.data[0]);
    const uint128_t* submitted_b = (const uint128_t*)(&tag_b.data[0]);

    if (*challenges_a == 0 && *challenges_b == 0 && *submitted_a != 0 && *submitted_b != 0 &&
        *submitted_a != *submitted_b) {
        throw_or_abort("Submitted values from 2 different rounds are mixing without challenges");
    }
}
} // namespace bb